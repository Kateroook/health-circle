import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueueService } from 'src/common/queue/queue.service';
import { ContactsService } from 'src/contacts/contacts.service';
import { GroupEntity } from 'src/groups/entities/group.entity';
import { GroupBlockListEntity } from 'src/groups/entities/group-block-list.entity';
import { GroupMemberEntity } from 'src/groups/entities/group-member.entity';
import { FirestoreSyncService } from 'src/notifications/firestore-sync.service';
import { NotificationType } from 'src/notifications/notification-types';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SecurityService } from 'src/security/security.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { FindOptionsWhere, Repository } from 'typeorm';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './groups.service';

describe('GroupService', () => {
  let service: GroupService;
  let groupRepository: jest.Mocked<Repository<GroupEntity>>;
  let blockListRepository: jest.Mocked<Repository<GroupBlockListEntity>>;
  let memberRepository: jest.Mocked<Repository<GroupMemberEntity>>;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let securityService: jest.Mocked<SecurityService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let usersService: jest.Mocked<UsersService>;

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
      ownerId: 'owner-1',
      members: [
        { groupId: 'group-1', userId: 'owner-1' } as GroupMemberEntity,
        { groupId: 'group-1', userId: 'user-1' } as GroupMemberEntity,
      ],
      inviteCode: 'ABC',
    } as unknown as GroupEntity;

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
            find: jest.fn(),
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
            existsBy: jest.fn(),
            update: jest.fn(),
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
          provide: getRepositoryToken(GroupMemberEntity),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
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
        {
          provide: FirestoreSyncService,
          useValue: {
            sendSyncSignal: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendMulticast: jest.fn(),
            sendMulticastByType: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            schedule: jest.fn(),
            send: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'ROLL_CALL_TIMEOUT_MINUTES') return 60;
              return null;
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getTokensForUsers: jest.fn().mockResolvedValue(['token-1']),
          },
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    groupRepository = module.get(getRepositoryToken(GroupEntity));
    userRepository = module.get(getRepositoryToken(UserEntity));
    blockListRepository = module.get(getRepositoryToken(GroupBlockListEntity));
    memberRepository = module.get(getRepositoryToken(GroupMemberEntity));
    securityService = module.get(SecurityService);
    notificationsService = module.get(NotificationsService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForUser', () => {
    it('should return groups and filter out the current user from members list', async () => {
      // Logic in service filters out the requesting user from the members list
      memberRepository.find.mockResolvedValue([{ groupId: 'group-1', userId: 'user-1' } as GroupMemberEntity]);
      groupRepository.find.mockResolvedValue([mockGroup]);
      userRepository.find.mockResolvedValue([
        { id: 'owner-1', firstName: 'Owner' } as UserEntity,
        { id: 'user-1', firstName: 'User' } as UserEntity,
      ]);

      const result = await service.findAllForUser('user-1');
      // logic maps members. In findAllForUser, it returns Member Profile objects.
      // Filtering user-1 should leave 1 member.
      expect(result[0].members).toHaveLength(1);
      expect(result[0].members[0].id).toBe('owner-1');
    });
  });

  describe('findOne', () => {
    it('should return group if user is owner', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      userRepository.find.mockResolvedValue([mockOwner, mockUser]);
      const result = await service.findOne('group-1', 'owner-1');
      expect(result.id).toBe('group-1');
    });

    it('should return group if user is member', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      userRepository.find.mockResolvedValue([mockOwner, mockUser]);
      const result = await service.findOne('group-1', 'user-1');
      expect(result.id).toBe('group-1');
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
      const groupData = {
        id: 'g1',
        inviteCode: 'NEW',
        members: [{ groupId: 'g1', userId: 'owner-1' }],
      } as unknown as GroupEntity;
      groupRepository.save.mockResolvedValue(groupData);
      groupRepository.findOne.mockResolvedValue(groupData);
      userRepository.find.mockResolvedValue([mockOwner]);

      const dto = { name: 'New Group', members: [] } as CreateGroupDto;
      const result = await service.createGroup('owner-1', dto);

      expect(groupRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'owner-1',
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

      const groupData = {
        id: 'g2',
        inviteCode: 'FREE',
        members: [{ groupId: 'g2', userId: 'owner-1' }],
      } as unknown as GroupEntity;
      groupRepository.save.mockImplementation((g) => Promise.resolve(g as GroupEntity));
      groupRepository.findOne.mockResolvedValue(groupData);
      userRepository.find.mockResolvedValue([mockOwner]);

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
      groupRepository.findOneBy.mockImplementation((criteria: FindOptionsWhere<GroupEntity>) => {
        if (criteria.id === 'group-1') return Promise.resolve(mockGroup);
        if (criteria.inviteCode === 'XYZ') return Promise.resolve(null as any);
        return Promise.resolve(null as any);
      });
      securityService.generateRandomToken.mockReturnValue('XYZ');
      groupRepository.save.mockResolvedValue({ ...mockGroup, inviteCode: 'XYZ' });

      const result = await service.regenerateInviteCode('owner-1', 'group-1');

      expect(result.code).toBe('XYZ');
      expect(groupRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not owner', async () => {
      groupRepository.findOneBy.mockResolvedValue(mockGroup);
      await expect(service.regenerateInviteCode('user-1', 'group-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('joinByInviteCode', () => {
    it('should add user to group members', async () => {
      // Create a specific group state for this test where user is NOT a member yet
      const groupWithOneMember = { ...mockGroup, members: [{ groupId: 'group-1', userId: 'owner-1' }] } as unknown as GroupEntity;

      groupRepository.findOne
        .mockResolvedValueOnce(groupWithOneMember) // Call in joinByInviteCode (finding group)
        .mockResolvedValueOnce({
          ...groupWithOneMember,
          members: [
            { groupId: 'group-1', userId: 'owner-1' } as GroupMemberEntity,
            { groupId: 'group-1', userId: 'user-1' } as GroupMemberEntity,
          ],
        } as unknown as GroupEntity); // Call in findOne (returning joined group)
      userRepository.existsBy.mockResolvedValue(true);
      userRepository.find.mockResolvedValue([mockOwner, mockUser]);
      blockListRepository.findOne.mockResolvedValue(null);
      memberRepository.save.mockResolvedValue({ groupId: 'group-1', userId: 'user-1' } as GroupMemberEntity);

      const result = await service.joinByInviteCode('user-1', 'ABC');

      expect(memberRepository.save).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
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
      groupRepository.findOne.mockResolvedValue(mockGroup); // mockGroup has user-1 already
      blockListRepository.findOne.mockResolvedValue(null);
      userRepository.existsBy.mockResolvedValue(true);

      await expect(service.joinByInviteCode('user-1', 'ABC')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateGroup', () => {
    it('should update group name and members', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      userRepository.find.mockResolvedValue([mockOwner, { id: 'new-mem' } as UserEntity]);
      groupRepository.save.mockImplementation((g) => Promise.resolve(g as GroupEntity));

      const dto = { id: 'group-1', name: 'Updated Name', members: [{ id: 'new-mem' }] } as UpdateGroupDto;

      const result = await service.updateGroup('owner-1', dto);

      expect(memberRepository.delete).toHaveBeenCalledWith({ groupId: 'group-1' });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw ForbiddenException if not owner', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      const dto = { id: 'group-1', name: 'X' } as UpdateGroupDto;
      await expect(service.updateGroup('user-1', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('leaveGroup', () => {
    it('should remove user from members', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);

      await service.leaveGroup('user-1', 'group-1');

      expect(memberRepository.delete).toHaveBeenCalledWith({ groupId: 'group-1', userId: 'user-1' });
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

      await service.blockUser('group-1', 'user-1', 'owner-1');

      expect(memberRepository.delete).toHaveBeenCalledWith({ groupId: 'group-1', userId: 'user-1' });
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

  describe('initiateRollCall', () => {
    it('should set lastRollCallAt and send notifications', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      usersService.getTokensForUsers.mockResolvedValue(['token-1']);
      groupRepository.save.mockResolvedValue(mockGroup);

      const result = await service.initiateRollCall('group-1', 'owner-1');

      expect(groupRepository.save).toHaveBeenCalled();
      expect(notificationsService.sendMulticastByType).toHaveBeenCalledWith(
        ['token-1'],
        NotificationType.ROLL_CALL,
        expect.objectContaining({ groupName: 'Test Group' }),
        expect.objectContaining({ groupId: 'group-1' }),
      );
      expect(result.message).toContain('розпочато');
    });

    it('should allow members to initiate', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      usersService.getTokensForUsers.mockResolvedValue(['token-1']);
      groupRepository.save.mockResolvedValue(mockGroup);

      const result = await service.initiateRollCall('group-1', 'user-1');

      expect(groupRepository.save).toHaveBeenCalled();
      expect(result.message).toContain('розпочато');
    });

    it('should throw Forbidden if not member or owner', async () => {
      groupRepository.findOne.mockResolvedValue(mockGroup);
      await expect(service.initiateRollCall('group-1', 'stranger')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFound if group missing', async () => {
      groupRepository.findOne.mockResolvedValue(null);
      await expect(service.initiateRollCall('x', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});
