import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SmsProvider } from './sms-provider.interface';

@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      this.logger.warn('Twilio configuration is missing. SMS not sent.');
      return;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams({
          To: to,
          From: this.fromNumber,
          Body: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`Failed to send SMS via Twilio: ${JSON.stringify(errorData)}`);
      } else {
        this.logger.log(`SMS sent successfully to ${to}`);
      }
    } catch (error) {
      this.logger.error('Error sending SMS via Twilio', error);
    }
  }
}
