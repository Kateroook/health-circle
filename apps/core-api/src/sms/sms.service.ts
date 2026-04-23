import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TwilioSmsProvider } from './twilio-sms-provider.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly provider: TwilioSmsProvider,
  ) {}

  async sendSms(to: string, message: string): Promise<void> {
    const isEnabled = this.configService.get<boolean>('SMS_ENABLED', false);

    if (!isEnabled) {
      this.logger.debug(`SMS is disabled. Skipping message to ${to}`);
      return;
    }

    if (!to) {
      this.logger.warn('Recipients phone number is missing. Skipping SMS.');
      return;
    }

    await this.provider.sendSms(to, message);
  }

  async sendBulkSms(tos: string[], message: string): Promise<void> {
    const isEnabled = this.configService.get<boolean>('SMS_ENABLED', false);
    if (!isEnabled || tos.length === 0) return;

    await Promise.allSettled(tos.map((to) => this.sendSms(to, message)));
  }
}
