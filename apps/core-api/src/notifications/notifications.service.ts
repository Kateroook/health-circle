import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!tokens.length) return;

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: {
            title,
            body,
            channelId: 'default',
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
        data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
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
