import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { UserStatus } from '../common/enums/user-status';
import { QueueService } from '../common/queue/queue.service';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';
import { FirestoreSyncService } from './firestore-sync.service';
import { NotificationsService } from './notifications.service';
import { StatusUpdateQueueWorker } from './status-update-queue.worker';

describe('StatusUpdateQueueWorker', () => {
  let worker: StatusUpdateQueueWorker;
  let queueService: jest.Mocked<QueueService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let firestoreSyncService: jest.Mocked<FirestoreSyncService>;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;
  let smsService: jest.Mocked<SmsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusUpdateQueueWorker,
        {
          provide: QueueService,
          useValue: { work: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: { sendMulticastByType: jest.fn() },
        },
        {
          provide: FirestoreSyncService,
          useValue: { sendSyncSignal: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: {
            getUserForStatusNotifications: jest.fn(),
            getTokensForUsers: jest.fn(),
            getPhoneNumbersForUsers: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: SmsService,
          useValue: { sendBulkSms: jest.fn() },
        },
      ],
    }).compile();

    worker = module.get<StatusUpdateQueueWorker>(StatusUpdateQueueWorker);
    queueService = module.get(QueueService);
    notificationsService = module.get(NotificationsService);
    firestoreSyncService = module.get(FirestoreSyncService);
    usersService = module.get(UsersService);
    configService = module.get(ConfigService);
    smsService = module.get(SmsService);
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });

  describe('handleSideEffects', () => {
    const senderUserId = 'sender-1';
    const memberUserIds = ['sender-1', 'member-1', 'member-2'];
    const sender = { id: senderUserId, firstName: 'Ivan', lastName: 'Ivanov', fcmToken: 'token-sender' };
    const payload = { senderUserId, status: UserStatus.SAFE, memberUserIds };

    beforeEach(() => {
      usersService.getUserForStatusNotifications.mockResolvedValue(sender as any);
      usersService.getTokensForUsers.mockResolvedValue(['token-member-1', 'token-member-2']);
      usersService.getPhoneNumbersForUsers.mockResolvedValue(['+3801', '+3802']);
    });

    it('should exclude sender from push notification recipients', async () => {
      await (worker as any).handleSideEffects(payload);

      expect(usersService.getTokensForUsers).toHaveBeenCalledWith(['member-1', 'member-2'], expect.any(String));
    });

    it('should send SMS only for DANGER status', async () => {
      await (worker as any).handleSideEffects({ ...payload, status: UserStatus.SAFE });
      expect(smsService.sendBulkSms).not.toHaveBeenCalled();

      await (worker as any).handleSideEffects({ ...payload, status: UserStatus.DANGER });
      expect(smsService.sendBulkSms).toHaveBeenCalledWith(
        ['+3801', '+3802'],
        expect.stringContaining('Ivan Ivanov у небезпеці!'),
      );
    });

    it('should exclude sender from SMS notification recipients', async () => {
      await (worker as any).handleSideEffects({ ...payload, status: UserStatus.DANGER });

      expect(usersService.getPhoneNumbersForUsers).toHaveBeenCalledWith(['member-1', 'member-2'], 'smsSafetyStatus');
    });

    it('should always send sync signal for affected users (including sender)', async () => {
      await (worker as any).handleSideEffects(payload);

      expect(firestoreSyncService.sendSyncSignal).toHaveBeenCalledWith(
        expect.arrayContaining(['sender-1', 'member-1', 'member-2']),
      );
    });
  });
});
