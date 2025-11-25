import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  async sendMulticast(tokens: string[], title: string, body: string, data?: any) {
    if (!tokens.length) return;

    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
      });
      console.log(`Notification sent to ${tokens.length} devices`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}
