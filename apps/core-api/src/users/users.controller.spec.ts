import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from 'src/common/entities/user.entity';
import { UserStatus } from 'src/common/enums/user-status';
import { AuthRequest } from 'src/common/types/auth-request';

import { CreateUserDto } from './dto/create-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  // Mock Request Object
  const mockRequest = {
    user: { id: 'user-id-123', email: 'test@test.com' },
    metadata: { ip: '127.0.0.1', userAgent: 'Jest' },
  } as unknown as AuthRequest;

  // Mock Service
  const mockUsersService = {
    getOne: jest.fn(),
    getFile: jest.fn(),
    save: jest.fn(),
    updateStatus: jest.fn(),
    saveFcmToken: jest.fn(),
    resetPassword: jest.fn(),
    upsertFile: jest.fn(),
    remove: jest.fn(),
    removeFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOne', () => {
    it('should return a user', async () => {
      const result = new UserEntity();
      service.getOne.mockResolvedValue(result);

      const params = { id: 'user-id-123' };
      const response = await controller.getOne(params, mockRequest);

      expect(service.getOne).toHaveBeenCalledWith(params.id, mockRequest.user);
      expect(response).toBe(result);
    });
  });

  describe('getAvatar', () => {
    it('should return a streamable file', async () => {
      const stream = new StreamableFile(Buffer.from('fake-image'));
      service.getFile.mockResolvedValue(stream);

      const params = { id: 'user-id-123' };
      const response = await controller.getAvatar(params);

      expect(service.getFile).toHaveBeenCalledWith(params.id);
      expect(response).toBe(stream);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto = new CreateUserDto();
      const result = new UserEntity();
      service.save.mockResolvedValue(result);

      const response = await controller.create(dto, mockRequest);

      expect(service.save).toHaveBeenCalledWith(
        dto,
        mockRequest.metadata,
        true, // isNew
        mockRequest.user,
      );
      expect(response).toBe(result);
    });
  });

  describe('modify', () => {
    it('should modify an existing user', async () => {
      const dto = new ModifyUserDto();
      const result = new UserEntity();
      service.save.mockResolvedValue(result);

      const response = await controller.modify(dto, mockRequest);

      expect(service.save).toHaveBeenCalledWith(
        dto,
        mockRequest.metadata,
        false, // isNew
        mockRequest.user,
      );
      expect(response).toBe(result);
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      const dto: UpdateUserStatusDto = { status: UserStatus.SAFE };
      const expectedResult = { status: UserStatus.SAFE, message: 'Updated' };

      // We assume service returns something, though your service signature might be void or object
      service.updateStatus.mockResolvedValue(expectedResult);

      const response = await controller.updateStatus(dto, mockRequest);

      expect(service.updateStatus).toHaveBeenCalledWith(mockRequest.user.id, dto.status);
      expect(response).toBe(expectedResult);
    });
  });

  describe('saveToken', () => {
    it('should save fcm token', async () => {
      const body = { token: 'fcm-token-123' };
      const expectedResult = { message: 'Token updated' };
      service.saveFcmToken.mockResolvedValue(expectedResult);

      const response = await controller.saveToken(body, mockRequest);

      expect(service.saveFcmToken).toHaveBeenCalledWith(mockRequest.user.id, body.token);
      expect(response).toBe(expectedResult);
    });
  });

  describe('resetPassword', () => {
    it('should call reset password service', async () => {
      const params = { id: 'user-id-123' };
      const expectedResult = { success: true, message: 'Код для скидання паролю надіслано на пошту' };
      service.resetPassword.mockResolvedValue(expectedResult);

      const response = await controller.resetPassword(params, mockRequest);

      expect(service.resetPassword).toHaveBeenCalledWith(params.id, mockRequest.metadata);
      expect(response).toBe(expectedResult);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar file', async () => {
      const params = { id: 'user-id-123' };
      const mockFile = {
        originalname: 'avatar.png',
        buffer: Buffer.from('img'),
      } as Express.Multer.File;

      const result = new UserEntity();
      service.upsertFile.mockResolvedValue(result);

      const response = await controller.uploadAvatar(params, mockFile);

      expect(service.upsertFile).toHaveBeenCalledWith(params.id, mockFile);
      expect(response).toBe(result);
    });
  });

  describe('remove', () => {
    it('should remove the user', async () => {
      const result = { success: true };
      service.remove.mockResolvedValue(result);

      const response = await controller.remove(mockRequest);

      expect(service.remove).toHaveBeenCalledWith(mockRequest.user.id, mockRequest.user, mockRequest.metadata);
      expect(response).toBe(result);
    });
  });

  describe('removeLogo', () => {
    it('should remove the file by id', async () => {
      const params = { id: 'user-id-123' };
      service.removeFile.mockResolvedValue(undefined);

      await controller.removeLogo(params);

      expect(service.removeFile).toHaveBeenCalledWith(params.id);
    });
  });
});
