import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from 'src/common/enums/user-status';
import { QueueService } from 'src/common/queue/queue.service';
import { SmsService } from 'src/sms/sms.service';
import { UsersService } from 'src/users/users.service';

import { FirestoreSyncService } from './firestore-sync.service';
import { NotificationTemplates, NotificationType } from './notification-types';
import { NotificationsService } from './notifications.service';
import { STATUS_UPDATE_SIDE_EFFECTS_QUEUE } from './status-update.queue.constants';

type StatusUpdateSideEffectsJobPayload = {
  senderUserId: string;
  status: UserStatus;
  memberUserIds: string[]; // recipients (may include sender)
};

@Injectable()
export class StatusUpdateQueueWorker implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly notificationsService: NotificationsService,
    private readonly firestoreSyncService: FirestoreSyncService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
  ) {}

  async onModuleInit() {
    await this.queueService.work(STATUS_UPDATE_SIDE_EFFECTS_QUEUE, async (jobs: any[]) => {
      for (const job of jobs) {
        const payload = (job?.data ?? job) as StatusUpdateSideEffectsJobPayload;
        await this.handleSideEffects(payload);
      }
    });
  }

  private async handleSideEffects(payload: StatusUpdateSideEffectsJobPayload): Promise<void> {
    const { senderUserId, status, memberUserIds } = payload;

    // Sender may have been removed between request and worker execution.
    const sender = await this.usersService.getUserForStatusNotifications(senderUserId);
    if (!sender) return;

    const isUnknown = status === UserStatus.UNKNOWN;
    const notificationType = isUnknown ? NotificationType.UNKNOWN_STATUS : NotificationType.STATUS_UPDATE;
    const template = NotificationTemplates[notificationType];

    const recipients = (memberUserIds ?? []).filter((id) => id !== senderUserId);
    const tokens = await this.usersService.getTokensForUsers(recipients, template.permissionKey);

    const devSendToSelf = this.configService.get<boolean>('DEV_SEND_PUSH_TO_SENDER', false);
    if (devSendToSelf && sender.fcmToken && !tokens.includes(sender.fcmToken)) {
      tokens.push(sender.fcmToken);
    }

    // Send FCM (if any recipient tokens exist).
    if (tokens.length > 0) {
      let statusName = 'невідомий';
      if (status === UserStatus.SAFE) statusName = 'у безпеці';
      else if (status === UserStatus.DANGER) statusName = 'треба допомога';
      else if (status === UserStatus.WAS_SAFE) statusName = 'був у безпеці';

      const mapsLink =
        sender.latitude && sender.longitude ? `https://maps.google.com/?q=${sender.latitude},${sender.longitude}` : undefined;

      await this.notificationsService.sendMulticastByType(
        tokens,
        notificationType,
        {
          firstName: sender.firstName,
          lastName: sender.lastName,
          statusName,
          status,
          ...(sender.latitude ? { latitude: String(sender.latitude) } : {}),
          ...(sender.longitude ? { longitude: String(sender.longitude) } : {}),
        },
        {
          userId: senderUserId,
          status,
          ...(sender.latitude ? { latitude: String(sender.latitude) } : {}),
          ...(sender.longitude ? { longitude: String(sender.longitude) } : {}),
          ...(status === UserStatus.DANGER && sender.latitude && sender.longitude ? { categoryIdentifier: 'DANGER_STATUS' } : {}),
        },
      );
    }

    // Always send sync signal for affected users.
    const syncUserIds = Array.from(new Set([...recipients, senderUserId]));
    await this.firestoreSyncService.sendSyncSignal(syncUserIds);

    // SMS Notifications for DANGER status.
    if (status === UserStatus.DANGER) {
      const phones = await this.usersService.getPhoneNumbersForUsers(recipients, 'smsSafetyStatus');
      if (phones.length > 0) {
        let message = `${sender.firstName} ${sender.lastName} у небезпеці! (Health Circle)`;
        if (sender.latitude && sender.longitude) {
          message += `\n📍 Розташування: https://maps.google.com/?q=${sender.latitude},${sender.longitude}`;
        }
        await this.smsService.sendBulkSms(phones, message);
      }
    }
  }
}
