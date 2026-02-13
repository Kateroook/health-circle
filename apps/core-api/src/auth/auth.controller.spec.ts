import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { instanceToPlain } from 'class-transformer';
import { Response } from 'express';
import { AuthRequest } from 'src/common/types/auth-request';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { SetupPasswordDto } from './dto/token-query.dto';
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
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockConfirmationsService = {};

  // Mock Request & Response
  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    firstName: 'John',
    lastName: 'Doe',
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
    it('should call authService.setupPassword', async () => {
      // Updated to match your SetupPasswordDto
      const query: SetupPasswordDto = {
        email: 'test@test.com',
        code: '123456',
      };

      // Updated to match your UserSetupPasswordDto
      const body: UserSetupPasswordDto = {
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!',
      };

      const expectedResult = { success: true };

      mockAuthService.setupPassword.mockResolvedValue(expectedResult as any);

      const result = await controller.setupPassword(query, body, mockRequest);

      expect(authService.setupPassword).toHaveBeenCalledWith(mockRequest.user, body);
      expect(result).toBe(expectedResult);
    });
  });

  describe('getProfile', () => {
    it('should return the user profile from request transformed to plain object', () => {
      const result = controller.getProfile(mockRequest);

      // instanceToPlain checks
      expect(result).toEqual(instanceToPlain(mockUser));
      expect(result).toHaveProperty('id', 'user-123');
      expect(result).toHaveProperty('email', 'test@test.com');
    });
  });
});
