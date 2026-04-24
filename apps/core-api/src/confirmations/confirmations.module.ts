import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from 'src/email/email.module';
import { SecurityModule } from 'src/security/security.module';
import { UserEntity } from 'src/users/entities/user.entity';

import { ConfirmationsService } from './confirmations.service';
import { ConfirmationCodeEntity } from './entities/confirmation-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ConfirmationCodeEntity]), EmailModule, SecurityModule],
  providers: [ConfirmationsService],
  exports: [ConfirmationsService],
})
export class ConfirmationsModule {}
