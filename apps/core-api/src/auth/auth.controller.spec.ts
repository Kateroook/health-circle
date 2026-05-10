import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { instanceToPlain } from 'class-transformer';
import { Response } from 'express';
import { AuthRequest } from 'src/common/types/auth-request';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { ConfirmationTypes } from 'src/confirmations/enums/confirmation-type';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ResendRegistrationCodeDto } from './dto/resend-registration-code.dto';
import { SetupPasswordDto } from './dto/token-query.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserSetupPasswordDto } from './dto/user-setup-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  // Mock Dependencies
  const mockAuthService = {
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    setupPassword: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resendRegistrationCode: jest.fn(),
    resetPassword: jest.fn(),
    checkEmail: jest.fn(),
    checkPhone: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockConfirmationsService = {
    verifyCode: jest.fn(),
  };

  // Mock Request & Response
  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    firstName: 'John',
    lastName: 'Doe',
    status: 'WAS_SAFE',
    region: 'Kyiv',
    district: 'Shevchenkivskyi',
    alertRegionUid: 31,
  };

  const mockRequest = {
    user: mockUser,
    metadata: {
      ip: '127.0.0.1',
      userAgent: 'Jest',
    },
  } as unknown as AuthRequest;

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            limit: 10,
            ttl: 60,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ConfirmationsService, useValue: mockConfirmationsService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const expectedResult = new LoginResponseDto();
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(mockRequest, mockResponse);

      expect(authService.login).toHaveBeenCalledWith(mockRequest.user, mockRequest.metadata, mockResponse);
      expect(result).toBe(expectedResult);
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout(mockRequest);

      expect(authService.logout).toHaveBeenCalledWith(mockRequest.user, mockRequest.metadata);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh', async () => {
      const expectedResult = new LoginResponseDto();
      mockAuthService.refresh.mockResolvedValue(expectedResult);

      const result = await controller.refresh(mockRequest, mockResponse);

      expect(authService.refresh).toHaveBeenCalledWith(mockRequest.user, mockRequest.metadata, mockResponse);
      expect(result).toBe(expectedResult);
    });
  });

  describe('setupPassword', () => {
    it('should verify confirmation code, call authService.setupPassword and return success', async () => {
      const query: SetupPasswordDto = {
        email: 'test@test.com',
        code: '123456',
      };

      const body: UserSetupPasswordDto = {
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
      };

      mockConfirmationsService.verifyCode.mockResolvedValue(mockRequest.user);
      mockAuthService.setupPassword.mockResolvedValue(undefined);

      const result = await controller.setupPassword(query, body);

      expect(mockConfirmationsService.verifyCode).toHaveBeenCalledWith(ConfirmationTypes.REGISTRATION, 'test@test.com', '123456');
      expect(authService.setupPassword).toHaveBeenCalledWith(mockRequest.user, body);
      expect(result).toEqual({ success: true, message: 'Пароль успішно встановлено' });
    });
  });

  describe('getProfile', () => {
    it('should return the user profile from request transformed to plain object', () => {
      const result = controller.getProfile(mockRequest);

      // instanceToPlain checks
      expect(result).toEqual(instanceToPlain(mockUser));
      expect(result).toHaveProperty('id', 'user-123');
      expect(result).toHaveProperty('email', 'test@test.com');
      expect(result).toHaveProperty('status', 'WAS_SAFE');
      expect(result).toHaveProperty('alertRegionUid', 31);
    });
  });

  describe('changePassword', () => {
    it('should delegate to authService.changePassword and return success', async () => {
      const body: UserChangePasswordDto = {
        oldPassword: 'OldPass123!@#',
        newPassword: 'NewPass456!@#',
        confirmNewPassword: 'NewPass456!@#',
      };
      mockAuthService.changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(body, mockRequest);

      expect(authService.changePassword).toHaveBeenCalledWith(mockRequest.user, body);
      expect(result).toEqual({ success: true, message: 'Пароль успішно змінено' });
    });
  });

  describe('forgotPassword', () => {
    it('should delegate to authService.forgotPassword and return success', async () => {
      const body: ForgotPasswordDto = { email: 'test@test.com' };
      mockAuthService.forgotPassword.mockResolvedValue(true);

      const result = await controller.forgotPassword(body);

      expect(authService.forgotPassword).toHaveBeenCalledWith('test@test.com');
      expect(result).toEqual({
        success: true,
        message: 'Якщо обліковий запис існує, ми надішлемо інструкції для скидання паролю на вашу пошту',
      });
    });
  });

  describe('resendRegistrationCode', () => {
    it('should delegate to authService.resendRegistrationCode and return success', async () => {
      const body: ResendRegistrationCodeDto = { email: 'test@test.com' };
      mockAuthService.resendRegistrationCode.mockResolvedValue(true);

      const result = await controller.resendRegistrationCode(body);

      expect(authService.resendRegistrationCode).toHaveBeenCalledWith('test@test.com');
      expect(result).toEqual({
        success: true,
        message: 'Якщо реєстрація ще не завершена, ми надішлемо код підтвердження повторно',
      });
    });
  });

  describe('resetPassword', () => {
    it('should delegate to authService.resetPassword and return success', async () => {
      const query: SetupPasswordDto = { email: 'test@test.com', code: '123456' };
      const body: UserSetupPasswordDto = {
        newPassword: 'ResetPass789!@#',
        confirmNewPassword: 'ResetPass789!@#',
      };
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      mockConfirmationsService.verifyCode.mockResolvedValue(mockRequest.user);

      const result = await controller.resetPassword(query, body);

      expect(mockConfirmationsService.verifyCode).toHaveBeenCalledWith(
        ConfirmationTypes.PASSWORD_RESET,
        'test@test.com',
        '123456',
      );
      expect(authService.resetPassword).toHaveBeenCalledWith(mockRequest.user, body);
      expect(result).toEqual({ success: true, message: 'Пароль успішно скинуто' });
    });
  });
  describe('checkEmail', () => {
    it('should return success if email is available', async () => {
      mockAuthService.checkEmail.mockResolvedValue(false);
      const result = await controller.checkEmail({ email: 'test@test.com' });
      expect(authService.checkEmail).toHaveBeenCalledWith('test@test.com');
      expect(result).toEqual({ success: true });
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockAuthService.checkEmail.mockResolvedValue(true);
      await expect(controller.checkEmail({ email: 'test@test.com' })).rejects.toThrow(BadRequestException);
      expect(authService.checkEmail).toHaveBeenCalledWith('test@test.com');
    });
  });

  describe('checkPhone', () => {
    it('should return success if phone is available', async () => {
      mockAuthService.checkPhone.mockResolvedValue(false);
      const result = await controller.checkPhone({ phone: '+380991234567' });
      expect(authService.checkPhone).toHaveBeenCalledWith('+380991234567');
      expect(result).toEqual({ success: true });
    });

    it('should throw BadRequestException if phone already exists', async () => {
      mockAuthService.checkPhone.mockResolvedValue(true);
      await expect(controller.checkPhone({ phone: '+380991234567' })).rejects.toThrow(BadRequestException);
      expect(authService.checkPhone).toHaveBeenCalledWith('+380991234567');
    });
  });
});
