import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupEntity } from 'src/common/entities/group.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { UserStatus } from 'src/common/enums/user-status';
import { NotificationsService } from 'src/notifications/notifications.service';
import { In, Repository } from 'typeorm';

import { StatusSchedulerService } from './status-scheduler.service';

describe('StatusSchedulerService', () => {
  let service: StatusSchedulerService;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let groupRepository: jest.Mocked<Repository<GroupEntity>>;
  let notificationsService: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusSchedulerService,
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
          provide: NotificationsService,
          useValue: {
            sendMulticast: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StatusSchedulerService>(StatusSchedulerService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    groupRepository = module.get(getRepositoryToken(GroupEntity));
    notificationsService = module.get(NotificationsService);
  });

  describe('handleRollCallTimeouts', () => {
    it('should update users to UNKNOWN if they missed a roll call by >1h', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

      const mockUser = {
        id: 'user-1',
        status: UserStatus.SAFE,
        lastStatusUpdate: threeHoursAgo,
      } as UserEntity;

      const mockGroup = {
        id: 'group-1',
        name: 'Test Group',
        lastRollCallAt: twoHoursAgo,
        members: [mockUser],
      } as GroupEntity;

      groupRepository.find.mockResolvedValue([mockGroup]);
      userRepository.find.mockResolvedValue([]); // For handleStatusExpiry

      await service.handleStatusTransitions();

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: In(['user-1']) },
        expect.objectContaining({ status: UserStatus.UNKNOWN }),
      );
    });
  });

  describe('handleStatusExpiry', () => {
    it('should transition SAFE -> WAS_SAFE after 8 hours', async () => {
      const nineHoursAgo = new Date(Date.now() - 9 * 60 * 60 * 1000);
      const mockUser = { id: 'user-1', status: UserStatus.SAFE, lastStatusUpdate: nineHoursAgo } as UserEntity;

      groupRepository.find.mockResolvedValue([]); // For handleRollCallTimeouts
      userRepository.find.mockResolvedValue([mockUser]); // For handleStatusExpiry

      await service.handleStatusTransitions();

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: In(['user-1']) },
        expect.objectContaining({ status: UserStatus.WAS_SAFE }),
      );
    });
  });
});
