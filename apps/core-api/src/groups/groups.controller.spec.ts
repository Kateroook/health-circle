import { Test, TestingModule } from '@nestjs/testing';
import { GroupEntity } from 'src/common/entities/group.entity';
import { AuthRequest } from 'src/common/types/auth-request';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupController } from './groups.controller';
import { GroupService } from './groups.service';

describe('GroupController', () => {
  let controller: GroupController;
  let service: jest.Mocked<GroupService>;

  const mockRequest = {
    user: { id: 'user-id-123' },
  } as AuthRequest;

  const mockGroupService = {
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
    createGroup: jest.fn(),
    leaveGroup: jest.fn(),
    updateGroup: jest.fn(),
    deleteGroup: jest.fn(),
    regenerateInviteCode: jest.fn(),
    joinByInviteCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        {
          provide: GroupService,
          useValue: mockGroupService,
        },
      ],
    }).compile();

    controller = module.get<GroupController>(GroupController);
    service = module.get(GroupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all groups for the user', async () => {
      const result = [new GroupEntity(), new GroupEntity()];
      service.findAllForUser.mockResolvedValue(result);

      const response = await controller.getAll(mockRequest);

      expect(service.findAllForUser).toHaveBeenCalledWith(mockRequest.user.id);
      expect(response).toBe(result);
    });
  });

  describe('getOne', () => {
    it('should return a single group', async () => {
      const params = { id: 'group-id' };
      const result = new GroupEntity();
      service.findOne.mockResolvedValue(result);

      const response = await controller.getOne(params, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(params.id, mockRequest.user.id);
      expect(response).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a new group', async () => {
      const dto = new CreateGroupDto();
      const result = { inviteCode: 'ABC-123' } as any;
      service.createGroup.mockResolvedValue(result);

      const response = await controller.create(dto, mockRequest);

      expect(service.createGroup).toHaveBeenCalledWith(mockRequest.user.id, dto);
      expect(response).toBe(result);
    });
  });

  describe('leave', () => {
    it('should leave the group', async () => {
      const params = { id: 'group-id' };
      const result = { success: true };
      service.leaveGroup.mockResolvedValue(result as any);

      const response = await controller.leave(params, mockRequest);

      expect(service.leaveGroup).toHaveBeenCalledWith(mockRequest.user.id, params.id);
      expect(response).toBe(result);
    });
  });

  describe('update', () => {
    it('should update the group', async () => {
      const dto = new UpdateGroupDto();
      const result = new GroupEntity();
      service.updateGroup.mockResolvedValue(result);

      const response = await controller.update(dto, mockRequest);

      expect(service.updateGroup).toHaveBeenCalledWith(mockRequest.user.id, dto);
      expect(response).toBe(result);
    });
  });

  describe('delete', () => {
    it('should delete the group', async () => {
      const params = { id: 'group-id' };
      const result = { success: true };
      service.deleteGroup.mockResolvedValue(result as any);

      const response = await controller.delete(params, mockRequest);

      expect(service.deleteGroup).toHaveBeenCalledWith(mockRequest.user.id, params.id);
      expect(response).toBe(result);
    });
  });

  describe('regenerateInvite', () => {
    it('should generate a new invite code', async () => {
      const params = { id: 'group-id' };
      const result = { inviteCode: 'NEW-CODE' };
      service.regenerateInviteCode.mockResolvedValue(result as any);

      const response = await controller.regenerateInvite(params, mockRequest);

      expect(service.regenerateInviteCode).toHaveBeenCalledWith(mockRequest.user.id, params.id);
      expect(response).toBe(result);
    });
  });

  describe('joinGroup', () => {
    it('should join group by code', async () => {
      const dto: JoinGroupDto = { code: 'ABC-123' };
      const result = { success: true };
      service.joinByInviteCode.mockResolvedValue(result as any);

      const response = await controller.joinGroup(dto, mockRequest);

      expect(service.joinByInviteCode).toHaveBeenCalledWith(mockRequest.user.id, dto.code);
      expect(response).toBe(result);
    });
  });
});
