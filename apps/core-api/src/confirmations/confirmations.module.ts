import { Module } from '@nestjs/common';
import { EmailModule } from 'src/email/email.module';
import { SecurityService } from 'src/security/security.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/common/entities/user.entity';
import { ConfirmationsController } from './confirmations.controller';
import { ConfirmationsService } from './confirmations.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), EmailModule],
  providers: [ConfirmationsService, SecurityService],
  exports: [ConfirmationsService],
  controllers: [ConfirmationsController],
})
export class ConfirmationsModule {}
