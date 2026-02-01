import { Module } from '@nestjs/common';
import { EmailModule } from 'src/email/email.module';
import { SecurityService } from 'src/security/security.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfirmationCodeEntity } from 'src/common/entities/confirmation-code.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { ConfirmationsService } from './confirmations.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ConfirmationCodeEntity]), EmailModule],
  providers: [ConfirmationsService, SecurityService],
  exports: [ConfirmationsService],
})
export class ConfirmationsModule {}
