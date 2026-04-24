import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';

import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { TwilioSmsProvider } from './twilio-sms-provider.service';

@Module({
  imports: [ConfigModule, forwardRef(() => UsersModule)],
  providers: [SmsService, TwilioSmsProvider],
  controllers: [SmsController],
  exports: [SmsService],
})
export class SmsModule {}
