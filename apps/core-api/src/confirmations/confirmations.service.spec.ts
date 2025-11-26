import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserEntity } from 'src/common/entities/user.entity';
import { EmailService } from 'src/email/email.service';
import { SecurityService } from 'src/security/security.service';
import { Repository } from 'typeorm';
import { ConfirmationsService } from './confirmations.service';
import { ConfirmationTypes } from './enums/confirmation-type';
import { SetupPasswordReasons } from './enums/setup-password-reasons';

describe('ConfirmationsService', () => {
  let service: ConfirmationsService;
  let cacheManager: jest.Mocked<Cache>;
  let emailService: jest.Mocked<EmailService>;
  let securityService: jest.Mocked<SecurityService>;
  let usersRepository: jest.Mocked<Repository<UserEntity>>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  } as UserEntity;

  const MOCK_CODE = '123456';
  const MOCK_TTL_SEC = 60;

  beforeEach(async () => {
    const mockCacheManager = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const mockEmailService = {
      registration: jest.fn(),
      changePassword: jest.fn(),
    };

    const mockSecurityService = {
      getConfirmCode: jest.fn().mockReturnValue(MOCK_CODE),
    };

    const mockUsersRepository = {
      findOne: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key.includes('_TTL')) return MOCK_TTL_SEC;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmationsService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SecurityService, useValue: mockSecurityService },
        { provide: getRepositoryToken(UserEntity), useValue: mockUsersRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ConfirmationsService>(ConfirmationsService);
    cacheManager = module.get(CACHE_MANAGER);
    emailService = module.get(EmailService);
    securityService = module.get(SecurityService);
    usersRepository = module.get(getRepositoryToken(UserEntity));
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setupPasswordCode', () => {
    it('should generate code, cache it, and send registration email for setup reason', async () => {
      const email = 'new@example.com';
      const userId = 'u1';
      const reason = SetupPasswordReasons.setup;

      const result = await service.setupPasswordCode(email, userId, reason);

      expect(result).toBe(MOCK_CODE);

      // 1. Check Code Generation
      expect(securityService.getConfirmCode).toHaveBeenCalled();

      // 2. Check Cache Set (TTL * 1000)
      const expectedKey = `${ConfirmationTypes.setupPassword}:${userId}`;
      expect(cacheManager.set).toHaveBeenCalledWith(expectedKey, { code: MOCK_CODE, reason }, MOCK_TTL_SEC * 1000);

      // 3. Check Email Sending
      expect(emailService.registration).toHaveBeenCalledWith(email, expect.objectContaining({ code: MOCK_CODE }));
      expect(emailService.changePassword).not.toHaveBeenCalled();
    });

    it('should generate code, cache it, and send change password email for reset reason', async () => {
      const email = 'reset@example.com';
      const userId = 'u1';
      const reason = SetupPasswordReasons.reset;

      await service.setupPasswordCode(email, userId, reason);

      expect(cacheManager.set).toHaveBeenCalled();
      expect(emailService.changePassword).toHaveBeenCalledWith(email, expect.objectContaining({ code: MOCK_CODE }));
      expect(emailService.registration).not.toHaveBeenCalled();
    });

    it('should handle expire reason (cache only, no specific email in switch)', async () => {
      const email = 'expire@example.com';
      const userId = 'u1';
      const reason = SetupPasswordReasons.expire;

      await service.setupPasswordCode(email, userId, reason);

      expect(cacheManager.set).toHaveBeenCalledWith(expect.any(String), { code: MOCK_CODE, reason }, MOCK_TTL_SEC * 1000);
      // Switch case doesn't have a default or expire block for email
      expect(emailService.registration).not.toHaveBeenCalled();
      expect(emailService.changePassword).not.toHaveBeenCalled();
    });
  });

  describe('verifyCode', () => {
    const type = ConfirmationTypes.setupPassword;
    const email = 'test@example.com';

    it('should return user profile if code matches', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      cacheManager.get.mockResolvedValue({ code: MOCK_CODE, reason: 'setup' });

      const result = await service.verifyCode(type, email, MOCK_CODE);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email, lockedAt: expect.anything() }, // IsNull() matcher is complex in mock, anything() suffices
      });
      expect(cacheManager.get).toHaveBeenCalledWith(`${type}:${mockUser.id}`);
      expect(result).toBeInstanceOf(UserProfileDto);
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyCode(type, email, MOCK_CODE)).rejects.toThrow(UnauthorizedException);

      // Should fail before checking cache
      expect(cacheManager.get).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if cache is empty (expired)', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      cacheManager.get.mockResolvedValue(undefined); // Cache miss

      await expect(service.verifyCode(type, email, MOCK_CODE)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if code mismatch', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      cacheManager.get.mockResolvedValue({ code: 'WRONG_CODE', reason: 'setup' });

      await expect(service.verifyCode(type, email, MOCK_CODE)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('consumeToken', () => {
    it('should delete token from cache', async () => {
      const type = ConfirmationTypes.setupPassword;
      const userId = 'u1';
      const expectedKey = `${type}:${userId}`;

      await service.consumeToken(type, userId);

      expect(cacheManager.del).toHaveBeenCalledWith(expectedKey);
    });
  });
});
