import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SmsService } from './sms.service';
import { TwilioSmsProvider } from './twilio-sms-provider.service';

@Module({
  imports: [ConfigModule],
  providers: [SmsService, TwilioSmsProvider],
  exports: [SmsService],
})
export class SmsModule {}
