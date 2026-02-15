import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupEntity } from 'src/common/entities/group.entity';
import { GroupBlockListEntity } from 'src/common/entities/group-block-list.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { ContactsService } from 'src/contacts/contacts.service';
import { SecurityService } from 'src/security/security.service';
import { In, Repository } from 'typeorm';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './groups.service';

describe('GroupService', () => {
  let service: GroupService;
  let groupRepository: jest.Mocked<Repository<GroupEntity>>;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let blockListRepository: jest.Mocked<Repository<GroupBlockListEntity>>;
  let securityService: jest.Mocked<SecurityService>;
  let contactsService: jest.Mocked<ContactsService>;

  // Variables are declared here but initialized in beforeEach
  let mockUser: UserEntity;
  let mockOwner: UserEntity;
  let mockGroup: GroupEntity;

  beforeEach(async () => {
    // 1. Reset data for every test to prevent mutation side-effects
    mockUser = { id: 'user-1', firstName: 'John' } as UserEntity;
    mockOwner = { id: 'owner-1', firstName: 'Owner' } as UserEntity;

    // Create a fresh group object so mutations (like in findAllForUser) don't persist
    mockGroup = {
      id: 'group-1',
      name: 'Test Group',
      owner: mockOwner,
      members: [mockOwner, mockUser],
      inviteCode: 'ABC',
    } as GroupEntity;

    // 2. Define mock behavior using the fresh objects
    const createQueryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockGroup]),
      subQuery: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      getQuery: jest.fn().mockReturnValue('SUB_QUERY'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: getRepositoryToken(GroupEntity),
          useValue: {
            createQueryBuilder: jest.fn(() => createQueryBuilderMock),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOneBy: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupBlockListEntity),
          useValue: {
            findOne: jest.fn(),
            upsert: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: ContactsService,
          useValue: {
            findAllForUser: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: SecurityService,
          useValue: {
            generateRandomToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    groupRepository = module.get(getRepositoryToken(GroupEntity));
    userRepository = module.get(getRepositoryToken(UserEntity));
    blockListRepository = module.get(getRepositoryToken(GroupBlockListEntity));
    securityService = module.get(SecurityService);
    contactsService = module.get(ContactsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForUser', () => {
    it('should return groups and filter out the current user from members list', async () => {
      // Logic in service filters out the requesting user from the members list
      const result = await service.findAllForUser('user-1');

      expect(groupRepository.createQueryBuilder).toHaveBeenCalledWith('group');
      // logic maps members. Since we passed mockGroup with 2 members (owner, user-1),
      // filtering user-1 should leave 1 member.
      expect(result[0].members).toHaveLength(1); // mockUser removed
      expect(result[0].members[0].id).toBe('owner-1');
    });
  });

  describe('findOne', () => {
    it('should return group if user is owner', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      const result = await service.findOne('group-1', 'owner-1');
      expect(result).toEqual(mockGroup);
    });

    it('should return group if user is member', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      const result = await service.findOne('group-1', 'user-1');
      expect(result).toEqual(mockGroup);
    });

    it('should throw NotFoundException if group missing', async () => {
      groupRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('x', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user not member or owner', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      await expect(service.findOne('group-1', 'stranger')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createGroup', () => {
    it('should create a group with unique invite code', async () => {
      securityService.generateRandomToken.mockReturnValue('NEW');
      securityService.generateRandomToken.mockReturnValue('NEW');
      groupRepository.findOneBy.mockResolvedValue(null); // Code is unique
      groupRepository.save.mockResolvedValue({ id: 'g1', inviteCode: 'NEW' } as GroupEntity);

      const dto = { name: 'New Group', members: [] } as CreateGroupDto;
      const result = await service.createGroup('owner-1', dto);

      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: { id: 'owner-1' },
          inviteCode: 'NEW',
        }),
      );
      expect(result.inviteCode).toBe('NEW');
    });

    it('should retry generating code if collision occurs', async () => {
      securityService.generateRandomToken.mockReturnValueOnce('TAKEN').mockReturnValueOnce('FREE');

      groupRepository.findOneBy
        .mockResolvedValueOnce({ id: 'existing' } as GroupEntity) // First check: Taken
        .mockResolvedValueOnce(null); // Second check: Free

      groupRepository.save.mockResolvedValue({} as GroupEntity);

      await service.createGroup('owner-1', { name: 'G' } as CreateGroupDto);

      expect(securityService.generateRandomToken).toHaveBeenCalledTimes(2);
      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          inviteCode: 'FREE',
        }),
      );
    });
  });

  describe('regenerateInviteCode', () => {
    it('should regenerate code if user is owner', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      securityService.generateRandomToken.mockReturnValue('XYZ');
      groupRepository.findOneBy.mockResolvedValue(null);
      groupRepository.save.mockResolvedValue({ ...mockGroup, inviteCode: 'XYZ' });

      const result = await service.regenerateInviteCode('owner-1', 'group-1');

      expect(result.code).toBe('XYZ');
      expect(groupRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not owner', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      await expect(service.regenerateInviteCode('user-1', 'group-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('joinByInviteCode', () => {
    it('should add user to group members', async () => {
      // Create a specific group state for this test where user is NOT a member yet
      const groupWithOneMember = { ...mockGroup, members: [mockOwner] } as GroupEntity;

      groupRepository.findOne.mockResolvedValue(groupWithOneMember);
      userRepository.findOneBy.mockResolvedValue(mockUser);
      blockListRepository.findOne.mockResolvedValue(null); // Not blocked
      groupRepository.save.mockResolvedValue({} as GroupEntity);

      const result = await service.joinByInviteCode('user-1', 'ABC');

      expect(groupWithOneMember.members).toContain(mockUser);
      expect(groupRepository.save).toHaveBeenCalled();
      expect(result.message).toContain('приєдналися');
    });

    it('should throw ForbiddenException if user is blocked', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      blockListRepository.findOne.mockResolvedValue({} as GroupBlockListEntity); // Blocked

      await expect(service.joinByInviteCode('user-1', 'ABC')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if code invalid', async () => {
      groupRepository.findOne.mockResolvedValue(null);
      await expect(service.joinByInviteCode('u1', 'BAD')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already member', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup); // mockUser is already in members
      blockListRepository.findOne.mockResolvedValue(null);
      userRepository.findOneBy.mockResolvedValue(mockUser);

      await expect(service.joinByInviteCode('user-1', 'ABC')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateGroup', () => {
    it('should update group name and members', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      const newMember = { id: 'new-mem' } as UserEntity;
      userRepository.find.mockResolvedValue([newMember]);
      groupRepository.save.mockImplementation((g) => Promise.resolve(g as GroupEntity));

      const dto = { id: 'group-1', name: 'Updated Name', members: [{ id: 'new-mem' }] } as UpdateGroupDto;

      const result = await service.updateGroup('owner-1', dto);

      expect(userRepository.find).toHaveBeenCalledWith({ where: { id: In(['new-mem']) } });
      expect(result.name).toBe('Updated Name');
      // Should contain owner + new member
      expect(result.members).toHaveLength(2);
      expect(result.members.some((m) => m.id === 'new-mem')).toBeTruthy();
      expect(result.members.some((m) => m.id === 'owner-1')).toBeTruthy();
    });

    it('should throw ForbiddenException if not owner', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      const dto = { id: 'group-1', name: 'X' } as UpdateGroupDto;
      await expect(service.updateGroup('user-1', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('leaveGroup', () => {
    it('should remove user from members', async () => {
      // Explicitly define group state for this test
      const group = { ...mockGroup, members: [mockOwner, mockUser] } as GroupEntity;
      groupRepository.findOne.mockResolvedValue(group);
      groupRepository.save.mockResolvedValue({} as GroupEntity);

      await service.leaveGroup('user-1', 'group-1');

      expect(group.members).toHaveLength(1);
      expect(group.members[0].id).toBe('owner-1'); // Only owner left
      expect(groupRepository.save).toHaveBeenCalledWith(group);
    });

    it('should throw ForbiddenException if owner tries to leave', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      await expect(service.leaveGroup('owner-1', 'group-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteGroup', () => {
    it('should remove group if owner', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      groupRepository.remove.mockResolvedValue({} as GroupEntity);

      await service.deleteGroup('owner-1', 'group-1');

      expect(groupRepository.remove).toHaveBeenCalledWith(mockGroup);
    });

    it('should throw ForbiddenException if not owner', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      await expect(service.deleteGroup('user-1', 'group-1')).rejects.toThrow(ForbiddenException);
    });
  });
  
  describe('blockUser', () => {
    it('should block user and remove from members', async () => {
        groupRepository.findOne.mockResolvedValue(mockGroup);
        // mockGroup has mockUser as member
        groupRepository.save.mockResolvedValue(mockGroup); 
        blockListRepository.upsert.mockResolvedValue({} as any);

        await service.blockUser('group-1', 'user-1', 'owner-1');
        
        // Members should be filtered
        expect(mockGroup.members).not.toContain(mockUser);
        expect(groupRepository.save).toHaveBeenCalled();
        expect(blockListRepository.upsert).toHaveBeenCalled();
    });

    it('should throw Forbidden if not owner', async () => {
        groupRepository.findOne.mockResolvedValue(mockGroup);
        await expect(service.blockUser('group-1', 'user-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('unblockUser', () => {
      it('should unblock user', async () => {
          groupRepository.findOne.mockResolvedValue(mockGroup);
          blockListRepository.delete.mockResolvedValue({} as any);

          await service.unblockUser('group-1', 'user-1', 'owner-1');

          expect(blockListRepository.delete).toHaveBeenCalled();
      });
  });
});
