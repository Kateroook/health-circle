import { Inject, Injectable, Logger } from '@nestjs/common';
import type { messaging } from 'firebase-admin';

import { FIREBASE_MESSAGING } from '../firebase/firebase.constants';
import { NotificationTemplates, NotificationType } from './notification-types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@Inject(FIREBASE_MESSAGING) private readonly firebaseMessaging: messaging.Messaging) {}

  async sendMulticastByType(
    tokens: string[],
    type: NotificationType,
    templateData: Record<string, unknown>,
    extraData?: Record<string, string>,
  ) {
    if (!tokens.length) return;

    const template = NotificationTemplates[type];
    if (!template) {
      this.logger.error(`No template found for notification type: ${type}`);
      return;
    }

    const title = template.title;
    const body = typeof template.body === 'function' ? template.body(templateData) : template.body;

    await this.sendMulticast(tokens, title, body, {
      ...extraData,
      type: template.fcmType,
      notificationType: type,
    });
  }

  async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!tokens.length) return;

    try {
      const response = await this.firebaseMessaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
        data,
      });

      this.logger.log(`Notifications sent: ${response.successCount} success, ${response.failureCount} failed`);
      if (response.failureCount > 0) {
        const maskToken = (token: string) => `${token.slice(0, 6)}…${token.slice(-4)}`;
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error(
              `Failed to send notification to token ${maskToken(tokens[idx] ?? '')}: ${resp.error?.message || 'Unknown error'}`,
            );
          }
        });
      }
    } catch (error: unknown) {
      this.logger.error(`Error sending notification: ${String(error)}`);
    }
  }
}
