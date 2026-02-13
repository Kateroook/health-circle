import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
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
          },
        },
        {
          provide: getRepositoryToken(UserPasswordEntity),
          useValue: {
            findOne: jest.fn(),
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

    it('should throw UnauthorizedException if password invalid', async () => {
      userRepository.findOne.mockResolvedValue(mockUserEntity);
      userPasswordRepository.findOne.mockResolvedValue({ passwordHash: 'hash' } as UserPasswordEntity);
      securityService.validate.mockResolvedValue(false);

      await expect(service.validateUser('x', 'p', mockMetadata)).rejects.toThrow(UnauthorizedException);
      expect(userActivitiesService.logActivity).toHaveBeenCalled();
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
    it('should generate tokens, revoke old sessions, and save new session', async () => {
      const userProfile = new UserProfileDto({ ...mockUserEntity });
      userSessionRepository.find.mockResolvedValue([{ id: 'old-sess' } as UserSessionEntity]);
      userSessionRepository.save.mockResolvedValue({} as UserSessionEntity);
      securityService.hash.mockResolvedValue('new-hash');

      const result = await service.login(userProfile, mockMetadata, mockResponse);

      // 1. Tokens generated
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2); // Access + Refresh
      expect(result.accessToken).toBe('signed-token');

      // 2. Old sessions revoked
      expect(userSessionRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ revokedAt: expect.any(Date) as unknown })]),
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
});
