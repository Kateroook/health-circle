import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectPinoLogger(NotificationsService.name)
    private readonly logger: PinoLogger,
  ) {}

  async sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!tokens.length) return;

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
      });

      this.logger.info('Notifications sent: %d success, %d failed', response.successCount, response.failureCount);
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error({ token: tokens[idx], error: resp.error }, 'Failed to send notification');
          }
        });
      }
    } catch (error: unknown) {
      this.logger.error({ error: String(error) }, 'Error sending notification');
    }
  }
}
