import { Module } from '@nestjs/common';
import { SecurityService } from 'security/security.service';
import { EmailModule } from 'src/email/email.module';

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
