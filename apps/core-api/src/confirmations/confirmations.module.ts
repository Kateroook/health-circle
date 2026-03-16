import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from 'src/email/email.module';
import { SecurityService } from 'src/security/security.service';
import { UserEntity } from 'src/users/entities/user.entity';

import { ConfirmationsService } from './confirmations.service';
import { ConfirmationCodeEntity } from './entities/confirmation-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ConfirmationCodeEntity]), EmailModule],
  providers: [ConfirmationsService, SecurityService],
  exports: [ConfirmationsService],
})
export class ConfirmationsModule {}
