import { Test, TestingModule } from '@nestjs/testing';

import { FIREBASE_MESSAGING } from '../firebase/firebase.constants';
import { NotificationType } from './notification-types';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const firebaseMessaging = {
    sendEachForMulticast: jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true }],
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: FIREBASE_MESSAGING,
          useValue: firebaseMessaging,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMulticastByType', () => {
    it('should send a status update notification', async () => {
      const sendSpy = jest.spyOn(service, 'sendMulticast');
      const tokens = ['token1'];
      const data = { firstName: 'Ivan', lastName: 'Ivanov', statusName: 'у безпеці' };

      await service.sendMulticastByType(tokens, NotificationType.STATUS_UPDATE, data);

      expect(sendSpy).toHaveBeenCalledWith(
        tokens,
        'Оновлення статусу',
        'Статус Ivan Ivanov змінено на "у безпеці".',
        expect.objectContaining({
          type: 'USER_STATUS_UPDATE',
          notificationType: NotificationType.STATUS_UPDATE,
        }),
      );
    });

    it('should send a roll call notification', async () => {
      const sendSpy = jest.spyOn(service, 'sendMulticast');
      const tokens = ['token1'];
      const data = { groupName: 'Family' };

      await service.sendMulticastByType(tokens, NotificationType.ROLL_CALL, data);

      expect(sendSpy).toHaveBeenCalledWith(
        tokens,
        'Перекличка! 📢',
        'Учасник кола "Family" просить підтвердити ваш статус безпеки.',
        expect.objectContaining({
          type: 'ROLL_CALL',
          notificationType: NotificationType.ROLL_CALL,
        }),
      );
    });

    it('should send an air alert notification', async () => {
      const sendSpy = jest.spyOn(service, 'sendMulticast');
      const tokens = ['token1'];
      const data = { regionName: 'Lviv', alertType: 'Повітряна тривога' };

      await service.sendMulticastByType(tokens, NotificationType.AIR_ALERT, data);

      expect(sendSpy).toHaveBeenCalledWith(
        tokens,
        '🚨 Повітряна тривога!',
        'Повітряна тривога: у вашому регіоні (Lviv) оголошено тривогу!',
        expect.objectContaining({
          type: 'AIR_ALERT',
          notificationType: NotificationType.AIR_ALERT,
        }),
      );
    });

    it('should send a mood reminder notification', async () => {
      const sendSpy = jest.spyOn(service, 'sendMulticast');
      const tokens = ['token1'];

      await service.sendMulticastByType(tokens, NotificationType.MOOD_REMINDER, {});

      expect(sendSpy).toHaveBeenCalledWith(
        tokens,
        'Як ви почуваєтесь? 😊',
        'Не забудьте відмітити свій настрій у додатку.',
        expect.objectContaining({
          type: 'MOOD_REMINDER',
          notificationType: NotificationType.MOOD_REMINDER,
        }),
      );
    });

    it('should send an unknown status notification', async () => {
      const sendSpy = jest.spyOn(service, 'sendMulticast');
      const tokens = ['token1'];
      const data = { firstName: 'Ivan', lastName: 'Ivanov' };

      await service.sendMulticastByType(tokens, NotificationType.UNKNOWN_STATUS, data);

      expect(sendSpy).toHaveBeenCalledWith(
        tokens,
        '❓ Статус невідомий',
        'Ivan Ivanov не оновив статус вчасно.',
        expect.objectContaining({
          type: 'USER_STATUS_UPDATE',
          notificationType: NotificationType.UNKNOWN_STATUS,
        }),
      );
    });
  });

  describe('sendMulticast', () => {
    it('should call firebase admin with correct format', async () => {
      const tokens = ['token1'];
      const title = 'Test Title';
      const body = 'Test Body';
      const data = { key: 'value' };

      await service.sendMulticast(tokens, title, body, data);

      expect(firebaseMessaging.sendEachForMulticast).toHaveBeenCalledWith({
        tokens,
        notification: { title, body },
        android: expect.any(Object),
        apns: expect.any(Object),
        data,
      });
    });

    it('should not call firebase if tokens are empty', async () => {
      await service.sendMulticast([], 't', 'b');
      expect(firebaseMessaging.sendEachForMulticast).not.toHaveBeenCalled();
    });
  });
});
