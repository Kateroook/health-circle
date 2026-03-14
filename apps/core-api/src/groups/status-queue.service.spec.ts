import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserStatus } from 'src/common/enums/user-status';
import { QueueService } from 'src/common/queue/queue.service';
import { GroupEntity } from 'src/groups/entities/group.entity';
import { GroupMemberEntity } from 'src/groups/entities/group-member.entity';
import { FirestoreSyncService } from 'src/notifications/firestore-sync.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { In, Repository } from 'typeorm';

import { StatusQueueService } from './status-queue.service';

describe('StatusQueueService', () => {
  let service: StatusQueueService;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let groupRepository: jest.Mocked<Repository<GroupEntity>>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let firestoreSyncService: jest.Mocked<FirestoreSyncService>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusQueueService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            find: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupMemberEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: FirestoreSyncService,
          useValue: {
            sendSyncSignal: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            updateStatus: jest.fn(),
            findByIds: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'ROLL_CALL_TIMEOUT_MINUTES') return 60;
              if (key === 'STATUS_EXPIRY_HOURS') return 8;
              return null;
            }),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendMulticast: jest.fn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            schedule: jest.fn(),
            send: jest.fn(),
            work: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StatusQueueService>(StatusQueueService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    groupRepository = module.get(getRepositoryToken(GroupEntity));
    notificationsService = module.get(NotificationsService);
    firestoreSyncService = module.get(FirestoreSyncService);
    usersService = module.get(UsersService);
  });

  describe('handleRollCallTimeouts', () => {
    it('should update users to UNKNOWN if they missed a group roll call by >1h', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

      const mockUser = {
        id: 'user-1',
        status: UserStatus.SAFE,
        lastStatusUpdate: threeHoursAgo,
      } as unknown as UserEntity;

      const mockGroup = {
        id: 'group-1',
        name: 'Test Group',
        lastRollCallAt: twoHoursAgo,
        members: [mockUser],
      } as unknown as GroupEntity;

      groupRepository.find.mockResolvedValue([mockGroup]);
      userRepository.find.mockResolvedValue([]);
      usersService.findByIds.mockResolvedValue([mockUser]);

      await service.handleStatusTransitions();

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: In(['user-1']) },
        expect.objectContaining({ status: UserStatus.UNKNOWN }),
      );
      expect(firestoreSyncService.sendSyncSignal).toHaveBeenCalledWith(['user-1']);
    });

    it('should respect ROLL_CALL_TIMEOUT_MINUTES from config', async () => {
      // Mock 30 minutes instead of default 60
      const configService = (service as any).configService as jest.Mocked<ConfigService>;
      configService.get.mockImplementation((key) => {
        if (key === 'ROLL_CALL_TIMEOUT_MINUTES') return 30;
        return 60; // default for others
      });

      const fortyMinutesAgo = new Date(Date.now() - 40 * 60 * 1000);
      const fiftyMinutesAgo = new Date(Date.now() - 50 * 60 * 1000);

      const mockUser = {
        id: 'user-1',
        status: UserStatus.SAFE,
        lastStatusUpdate: fiftyMinutesAgo,
      } as unknown as UserEntity;

      const mockGroup = {
        id: 'group-1',
        name: 'Test Group',
        lastRollCallAt: fortyMinutesAgo,
        members: [mockUser],
      } as unknown as GroupEntity;

      groupRepository.find.mockResolvedValue([mockGroup]);
      userRepository.find.mockResolvedValue([]);
      usersService.findByIds.mockResolvedValue([mockUser]);

      await service.handleStatusTransitions();

      // Should timeout because 40m > 30m threshold
      expect(userRepository.update).toHaveBeenCalledWith(
        { id: In(['user-1']) },
        expect.objectContaining({ status: UserStatus.UNKNOWN }),
      );

      // Reset mock for other tests
      configService.get.mockImplementation((key) => {
        if (key === 'ROLL_CALL_TIMEOUT_MINUTES') return 60;
        if (key === 'STATUS_EXPIRY_HOURS') return 8;
        return null;
      });
    });

    it('should NOT update users to UNKNOWN if they responded after the roll call started', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);

      const mockUser = {
        id: 'user-1',
        status: UserStatus.SAFE,
        lastStatusUpdate: oneHourAgo,
      } as unknown as UserEntity;

      const mockGroup = {
        id: 'group-1',
        name: 'Test Group',
        lastRollCallAt: twoHoursAgo,
        members: [mockUser],
      } as unknown as GroupEntity;

      groupRepository.find.mockResolvedValue([mockGroup]);
      userRepository.find.mockResolvedValue([]);
      usersService.findByIds.mockResolvedValue([mockUser]);

      await service.handleStatusTransitions();

      expect(userRepository.update).not.toHaveBeenCalledWith({ id: In(['user-1']) }, expect.any(Object));
    });

    it('should update users to UNKNOWN if they missed a personal roll call', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

      const mockUser = {
        id: 'user-personal',
        status: UserStatus.SAFE,
        lastStatusUpdate: threeHoursAgo,
        lastPersonalRollCallAt: twoHoursAgo,
      } as unknown as UserEntity;

      groupRepository.find.mockResolvedValue([]);
      userRepository.find.mockImplementation((args: any) => {
        if (args?.where && 'lastPersonalRollCallAt' in args.where) return Promise.resolve([mockUser]);
        return Promise.resolve([]);
      });

      await service.handleStatusTransitions();

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: In(['user-personal']) },
        expect.objectContaining({ status: UserStatus.UNKNOWN }),
      );
    });

    it('should NOT update users if they responded after the personal roll call started', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);

      const mockUser = {
        id: 'user-personal-active',
        status: UserStatus.SAFE,
        lastStatusUpdate: oneHourAgo,
        lastPersonalRollCallAt: twoHoursAgo,
      } as unknown as UserEntity;

      groupRepository.find.mockResolvedValue([]);
      userRepository.find.mockImplementation((args: any) => {
        if (args?.where && 'lastPersonalRollCallAt' in args.where) return Promise.resolve([mockUser]);
        return Promise.resolve([]);
      });

      await service.handleStatusTransitions();

      expect(userRepository.update).not.toHaveBeenCalledWith({ id: In(['user-personal-active']) }, expect.any(Object));
    });
  });

  describe('handleStatusExpiry', () => {
    it('should transition SAFE -> WAS_SAFE after 8 hours', async () => {
      const nineHoursAgo = new Date(Date.now() - 9 * 60 * 60 * 1000);
      const mockUser = { id: 'user-1', status: UserStatus.SAFE, lastStatusUpdate: nineHoursAgo } as UserEntity;

      groupRepository.find.mockResolvedValue([]);
      userRepository.find.mockImplementation((args: any) => {
        if (args?.where && args.where.status === UserStatus.SAFE) return Promise.resolve([mockUser]);
        return Promise.resolve([]);
      });

      await service.handleStatusTransitions();

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: In(['user-1']) },
        expect.objectContaining({ status: UserStatus.WAS_SAFE }),
      );
    });
  });
});
