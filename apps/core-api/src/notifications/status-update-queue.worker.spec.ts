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
    const sender = {
      id: senderUserId,
      firstName: 'Ivan',
      lastName: 'Ivanov',
      fcmToken: 'token-sender',
      latitude: 50.4501,
      longitude: 30.5234,
    };
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

    it('should send SMS with geolocation only for DANGER status', async () => {
      await (worker as any).handleSideEffects({ ...payload, status: UserStatus.SAFE });
      expect(smsService.sendBulkSms).not.toHaveBeenCalled();

      await (worker as any).handleSideEffects({ ...payload, status: UserStatus.DANGER });
      expect(smsService.sendBulkSms).toHaveBeenCalledWith(
        ['+3801', '+3802'],
        expect.stringContaining('https://maps.google.com/?q=50.4501,30.5234'),
      );
    });

    it('should pass mapsLink and categoryIdentifier to push notification for DANGER status', async () => {
      await (worker as any).handleSideEffects({ ...payload, status: UserStatus.DANGER });

      expect(notificationsService.sendMulticastByType).toHaveBeenCalledWith(
        ['token-member-1', 'token-member-2'],
        expect.anything(),
        expect.objectContaining({
          latitude: '50.4501',
          longitude: '30.5234',
          status: UserStatus.DANGER,
        }),
        expect.objectContaining({
          latitude: '50.4501',
          longitude: '30.5234',
          categoryIdentifier: 'DANGER_STATUS',
        }),
      );
    });

    it('should not pass mapsLink and categoryIdentifier if latitude or longitude is null', async () => {
      usersService.getUserForStatusNotifications.mockResolvedValue({ ...sender, latitude: null, longitude: null } as any);
      await (worker as any).handleSideEffects({ ...payload, status: UserStatus.DANGER });

      expect(notificationsService.sendMulticastByType).toHaveBeenCalledWith(
        ['token-member-1', 'token-member-2'],
        expect.anything(),
        expect.objectContaining({
          status: UserStatus.DANGER,
        }),
        expect.not.objectContaining({
          categoryIdentifier: 'DANGER_STATUS',
        }),
      );

      const calls = notificationsService.sendMulticastByType.mock.calls;
      const dataObj = calls[calls.length - 1][2];
      expect(dataObj.latitude).toBeUndefined();
      expect(dataObj.longitude).toBeUndefined();

      expect(smsService.sendBulkSms).toHaveBeenCalledWith(['+3801', '+3802'], 'Ivan Ivanov у небезпеці! (Health Circle)');
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
