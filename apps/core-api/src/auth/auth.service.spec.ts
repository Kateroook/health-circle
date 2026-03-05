import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Response } from 'express';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserEntity } from 'src/common/entities/user.entity';
import { UserPasswordEntity } from 'src/common/entities/user-password.entity';
import { UserSessionEntity } from 'src/common/entities/user-sessions.entity';
import { RequestMetadata } from 'src/common/types/request-metadata';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { SecurityService } from 'src/security/security.service';
import { UserActivitiesService } from 'src/user-activities/user-activities.service';
import { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserSetupPasswordDto } from './dto/user-setup-password.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let userPasswordRepository: jest.Mocked<Repository<UserPasswordEntity>>;
  let userSessionRepository: jest.Mocked<Repository<UserSessionEntity>>;
  let securityService: jest.Mocked<SecurityService>;
  let jwtService: jest.Mocked<JwtService>;
  let confirmationService: jest.Mocked<ConfirmationsService>;
  let userActivitiesService: jest.Mocked<UserActivitiesService>;

  const mockUserEntity = {
    id: 'user-123',
    email: 'test@example.com',
    lockedAt: null,
  } as unknown as UserEntity;

  const mockMetadata = {
    ipAddress: '127.0.0.1',
    userAgent: 'TestAgent',
    deviceInfo: {},
  } as RequestMetadata;

  const mockResponse = {
    cookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'MAX_FAILED_LOGIN_ATTEMPTS') return 5;
              return null;
            }),
            getOrThrow: jest.fn((key: string) => {
              if (key.includes('TTL')) return 3600; // 1 hour
              return 'secret';
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('signed-token'),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserPasswordEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserSessionEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn((dto: unknown) => dto as UserSessionEntity),
            save: jest.fn(),
          },
        },
        {
          provide: SecurityService,
          useValue: {
            validate: jest.fn(),
            hash: jest.fn(),
          },
        },
        {
          provide: UserActivitiesService,
          useValue: {
            logActivity: jest.fn(),
          },
        },
        {
          provide: ConfirmationsService,
          useValue: {
            consumeToken: jest.fn(),
            setupPasswordCode: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    userPasswordRepository = module.get(getRepositoryToken(UserPasswordEntity));
    userSessionRepository = module.get(getRepositoryToken(UserSessionEntity));
    securityService = module.get(SecurityService);
    jwtService = module.get(JwtService);
    confirmationService = module.get(ConfirmationsService);
    userActivitiesService = module.get(UserActivitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user profile if credentials are valid', async () => {
      userRepository.findOne.mockResolvedValue(mockUserEntity);
      userPasswordRepository.findOne.mockResolvedValue({ passwordHash: 'hash' } as UserPasswordEntity);
      securityService.validate.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'pass', mockMetadata);

      expect(result).toBeInstanceOf(UserProfileDto);
      expect(result.id).toBe(mockUserEntity.id);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.validateUser('x', 'p', mockMetadata)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user is locked', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUserEntity, lockedAt: new Date() } as UserEntity);
      await expect(service.validateUser('x', 'p', mockMetadata)).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException if password invalid and increment failed attempts', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUserEntity, failedLoginAttempts: 0 } as UserEntity);
      userPasswordRepository.findOne.mockResolvedValue({ passwordHash: 'hash' } as UserPasswordEntity);
      securityService.validate.mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'pass', mockMetadata)).rejects.toThrow(UnauthorizedException);
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ failedLoginAttempts: 1 }));
      expect(userActivitiesService.logActivity).toHaveBeenCalled();
    });

    it('should lock user when max failed attempts reached', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUserEntity, failedLoginAttempts: 4 } as UserEntity);
      userPasswordRepository.findOne.mockResolvedValue({ passwordHash: 'hash' } as UserPasswordEntity);
      securityService.validate.mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'pass', mockMetadata)).rejects.toThrow(UnauthorizedException);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          failedLoginAttempts: 5,
          lockedAt: expect.any(Date) as unknown,
        }),
      );
    });

    it('should NOT reset failed attempts or update lastLoginDate in validateUser (delegated to login)', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUserEntity, failedLoginAttempts: 2 } as UserEntity);
      userPasswordRepository.findOne.mockResolvedValue({ passwordHash: 'hash' } as UserPasswordEntity);
      securityService.validate.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'pass', mockMetadata);

      expect(result).toBeInstanceOf(UserProfileDto);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('verifyUser (Access Token Check)', () => {
    it('should return profile if session valid', async () => {
      const session = {
        id: 'sess-1',
        user: mockUserEntity,
      } as UserSessionEntity;
      userSessionRepository.findOne.mockResolvedValue(session);

      const payload = { sub: 'user-123', jti: 'jti-123' };
      const result = await service.verifyUser(payload, mockMetadata);

      expect(result.sessionId).toBe('sess-1');
      expect(userSessionRepository.save).toHaveBeenCalled(); // updates lastUsedAt
    });

    it('should throw UnauthorizedException if session missing', async () => {
      userSessionRepository.findOne.mockResolvedValue(null);
      await expect(service.verifyUser({ sub: 'u', jti: 'j' }, mockMetadata)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user locked', async () => {
      userSessionRepository.findOne.mockResolvedValue({
        user: { ...mockUserEntity, lockedAt: new Date() },
      } as UserSessionEntity);
      await expect(service.verifyUser({ sub: 'u', jti: 'j' }, mockMetadata)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifySession (Refresh Token Check)', () => {
    it('should return profile if token hash matches', async () => {
      const session = {
        id: 'sess-1',
        user: mockUserEntity,
        tokenHash: 'hashed-token',
      } as UserSessionEntity;
      userSessionRepository.findOne.mockResolvedValue(session);
      securityService.validate.mockResolvedValue(true);

      const result = await service.verifySession('raw-token', { sub: 'u', jti: 'j' });
      expect(result.sessionId).toBe('sess-1');
    });

    it('should throw UnauthorizedException if hash mismatch', async () => {
      const session = { tokenHash: 'hashed-token' };
      userSessionRepository.findOne.mockResolvedValue(session as unknown as UserSessionEntity);
      securityService.validate.mockResolvedValue(false);

      await expect(service.verifySession('t', { sub: 'u', jti: 'j' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should generate tokens, revoke old sessions, and save new session with user updates', async () => {
      const userProfile = new UserProfileDto({ ...mockUserEntity });
      userSessionRepository.find.mockResolvedValue([{ id: 'old-sess' } as UserSessionEntity]);
      userSessionRepository.save.mockResolvedValue({} as UserSessionEntity);
      securityService.hash.mockResolvedValue('new-hash');

      const result = await service.login(userProfile, mockMetadata, mockResponse);

      // 1. Tokens generated
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2); // Access + Refresh
      expect(result.accessToken).toBe('signed-token');

      // 2. Old sessions revoked and new session saved with user updates
      expect(userSessionRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ revokedAt: expect.any(Date) as unknown }),
          expect.objectContaining({
            user: expect.objectContaining({
              id: userProfile.id,
              lastLoginDate: expect.any(Date) as unknown,
              failedLoginAttempts: 0,
            }) as unknown,
          }),
        ]),
      );

      // 3. Activity logged
      expect(userActivitiesService.logActivity).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should rotate tokens and update session', async () => {
      const userProfile = new UserProfileDto({ ...mockUserEntity, sessionId: 'sess-1' });
      securityService.hash.mockResolvedValue('new-refresh-hash');

      const result = await service.refresh(userProfile, mockMetadata, mockResponse);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(userSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sess-1',
          tokenHash: 'new-refresh-hash',
        }),
      );
      expect(result.accessToken).toBe('signed-token');
    });
  });

  describe('logout', () => {
    it('should revoke session', async () => {
      const userProfile = new UserProfileDto({ ...mockUserEntity, sessionId: 'sess-1' });

      await service.logout(userProfile, mockMetadata);

      expect(userSessionRepository.save).toHaveBeenCalledWith({
        id: 'sess-1',
        revokedAt: expect.any(Date) as unknown,
      });
      expect(userActivitiesService.logActivity).toHaveBeenCalled();
    });
  });

  describe('setupPassword', () => {
    const userProfile = new UserProfileDto({ ...mockUserEntity });
    const dto: UserSetupPasswordDto = {
      newPassword: 'abc',
      confirmNewPassword: 'abc',
    };

    it('should save password and consume token', async () => {
      userPasswordRepository.findOne.mockResolvedValue(null);
      securityService.hash.mockResolvedValue('hashed-pass');

      await service.setupPassword(userProfile, dto);

      expect(userPasswordRepository.save).toHaveBeenCalledWith({
        user: { id: userProfile.id },
        passwordHash: 'hashed-pass',
      });
      expect(confirmationService.consumeToken).toHaveBeenCalledWith(userProfile.id);
    });

    it('should throw if passwords mismatch', async () => {
      await expect(service.setupPassword(userProfile, { ...dto, confirmNewPassword: 'xyz' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw if user already has password', async () => {
      userPasswordRepository.findOne.mockResolvedValue({ id: 'existing' } as UserPasswordEntity);
      await expect(service.setupPassword(userProfile, dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('changePassword', () => {
    const userProfile = new UserProfileDto({ ...mockUserEntity });
    const dto: UserChangePasswordDto = {
      oldPassword: 'OldPass123!@#',
      newPassword: 'NewPass456!@#',
      confirmNewPassword: 'NewPass456!@#',
    };

    it('should revoke old password and save new one', async () => {
      const existingPw = { id: 'pw-1', passwordHash: 'old-hash', revokedAt: null } as unknown as UserPasswordEntity;
      userPasswordRepository.findOne.mockResolvedValue(existingPw);
      securityService.validate.mockResolvedValue(true);
      securityService.hash.mockResolvedValue('new-hash');

      await service.changePassword(userProfile, dto);

      // Old password revoked
      expect(existingPw.revokedAt).toBeInstanceOf(Date);
      expect(userPasswordRepository.save).toHaveBeenCalledWith(existingPw);

      // New password saved
      expect(userPasswordRepository.save).toHaveBeenCalledWith({
        user: { id: userProfile.id },
        passwordHash: 'new-hash',
      });
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      await expect(service.changePassword(userProfile, { ...dto, confirmNewPassword: 'Different123!' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if no active password exists', async () => {
      userPasswordRepository.findOne.mockResolvedValue(null);

      await expect(service.changePassword(userProfile, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if old password is incorrect', async () => {
      userPasswordRepository.findOne.mockResolvedValue({ passwordHash: 'hash' } as UserPasswordEntity);
      securityService.validate.mockResolvedValue(false);

      await expect(service.changePassword(userProfile, dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should call setupPasswordCode when user exists and is not locked', async () => {
      userRepository.findOne.mockResolvedValue(mockUserEntity);

      await service.forgotPassword('test@example.com');

      expect(confirmationService.setupPasswordCode).toHaveBeenCalledWith('test@example.com', 'user-123', expect.anything());
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.forgotPassword('noone@test.com')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is locked', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUserEntity, lockedAt: new Date() } as UserEntity);

      await expect(service.forgotPassword('test@example.com')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('resetPassword', () => {
    const userProfile = new UserProfileDto({ ...mockUserEntity });
    const dto: UserSetupPasswordDto = {
      newPassword: 'ResetPass123!@',
      confirmNewPassword: 'ResetPass123!@',
    };

    it('should revoke existing passwords, save new one, and consume token', async () => {
      const existingPws = [
        { id: 'pw-1', revokedAt: null },
        { id: 'pw-2', revokedAt: null },
      ] as unknown as UserPasswordEntity[];
      userPasswordRepository.find.mockResolvedValue(existingPws);
      securityService.hash.mockResolvedValue('reset-hash');

      await service.resetPassword(userProfile, dto);

      // All existing passwords revoked
      for (const pw of existingPws) {
        expect(pw.revokedAt).toBeInstanceOf(Date);
      }
      expect(userPasswordRepository.save).toHaveBeenCalledWith(existingPws);

      // New password saved
      expect(userPasswordRepository.save).toHaveBeenCalledWith({
        user: { id: userProfile.id },
        passwordHash: 'reset-hash',
      });

      // Token consumed
      expect(confirmationService.consumeToken).toHaveBeenCalledWith(userProfile.id);
    });

    it('should work even when no existing passwords to revoke', async () => {
      userPasswordRepository.find.mockResolvedValue([]);
      securityService.hash.mockResolvedValue('reset-hash');

      await service.resetPassword(userProfile, dto);

      // New password saved
      expect(userPasswordRepository.save).toHaveBeenCalledWith({
        user: { id: userProfile.id },
        passwordHash: 'reset-hash',
      });
      expect(confirmationService.consumeToken).toHaveBeenCalledWith(userProfile.id);
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      await expect(service.resetPassword(userProfile, { ...dto, confirmNewPassword: 'Mismatch123!' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
