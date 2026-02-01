import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfirmationCodeEntity } from 'src/common/entities/confirmation-code.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { EmailService } from 'src/email/email.service';
import { SecurityService } from '../security/security.service';
import { ConfirmationsService } from './confirmations.service';
import { ConfirmationTypes } from './enums/confirmation-type';

const createMockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
});

type MockRepository = ReturnType<typeof createMockRepository>;

describe('ConfirmationsService', () => {
  let service: ConfirmationsService;
  let codesRepository: MockRepository;
  let usersRepository: MockRepository;
  let emailService: Partial<Record<keyof EmailService, jest.Mock>>;

  beforeEach(async () => {
    emailService = {
      registration: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmationsService,
        { provide: getRepositoryToken(UserEntity), useValue: createMockRepository() },
        { provide: getRepositoryToken(ConfirmationCodeEntity), useValue: createMockRepository() },
        { provide: EmailService, useValue: emailService },
        {
          provide: SecurityService,
          useValue: { getConfirmCode: jest.fn().mockReturnValue('123456') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(300) },
        },
      ],
    }).compile();

    service = module.get<ConfirmationsService>(ConfirmationsService);
    codesRepository = module.get(getRepositoryToken(ConfirmationCodeEntity));
    usersRepository = module.get(getRepositoryToken(UserEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setupPasswordCode', () => {
    it('should generate code, save to DB, and send registration email', async () => {
      await service.setupPasswordCode('test@test.com', 'user-1', ConfirmationTypes.REGISTRATION);

      // 1. Should delete old codes
      expect(codesRepository.delete).toHaveBeenCalledWith({
        user: {id: 'user-1'},
        type: ConfirmationTypes.REGISTRATION,
      });

      // 2. Should save new code
      expect(codesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: {id: 'user-1'},
          code: '123456',
          type: ConfirmationTypes.REGISTRATION,
        }),
      );

      // 3. Should send email
      expect(emailService.registration).toHaveBeenCalledWith(
        'test@test.com',
        expect.objectContaining({ code: '123456' }),
      );
    });
  });

  describe('verifyCode', () => {
    it('should throw if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(
        service.verifyCode(ConfirmationTypes.REGISTRATION, 'test@test.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if code does not exist', async () => {
      usersRepository.findOne.mockResolvedValue({ id: 'user-1' });
      codesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.verifyCode(ConfirmationTypes.REGISTRATION, 'test@test.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if code expired', async () => {
      usersRepository.findOne.mockResolvedValue({ id: 'user-1' });
      codesRepository.findOne.mockResolvedValue({
        code: '123456',
        expiresAt: new Date(Date.now() - 10000), // Past
      });

      await expect(
        service.verifyCode(ConfirmationTypes.REGISTRATION, 'test@test.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user if code is valid', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com' };
      usersRepository.findOne.mockResolvedValue(mockUser);
      codesRepository.findOne.mockResolvedValue({
        code: '123456',
        expiresAt: new Date(Date.now() + 10000), // Future
      });

      const result = await service.verifyCode(ConfirmationTypes.REGISTRATION, 'test@test.com', '123456');
      expect(result.id).toEqual(mockUser.id);
    });
  });
});