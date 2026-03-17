import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { NotificationTemplates, NotificationType } from './notification-types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendMulticastByType(tokens: string[], type: NotificationType, templateData: any, extraData?: Record<string, string>) {
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
      const response = await admin.messaging().sendEachForMulticast({
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
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error(`Failed to send notification to token ${tokens[idx]}: ${resp.error?.message || 'Unknown error'}`);
          }
        });
      }
    } catch (error: unknown) {
      this.logger.error(`Error sending notification: ${String(error)}`);
    }
  }
}
