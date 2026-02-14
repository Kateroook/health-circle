import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!tokens.length) return;

    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
      });
    } catch (error: unknown) {
      this.logger.error('Error sending notification', error instanceof Error ? error.stack : String(error));
    }
  }
}

