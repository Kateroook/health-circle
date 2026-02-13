import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserUniqueConstraint } from 'src/common/constraints/user-unique.constraint';
import { UserEntity } from 'src/common/entities/user.entity';
import { UserPasswordEntity } from 'src/common/entities/user-password.entity';
import { ConfirmationsModule } from 'src/confirmations/confirmations.module';
import { ExternalFilesModule } from 'src/external-files/external-files.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { SecurityService } from 'src/security/security.service';
import { UserActivitiesModule } from 'src/user-activities/user-activities.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserPasswordEntity]),
    UserActivitiesModule,
    ConfirmationsModule,
    ExternalFilesModule,
    NotificationsModule,
  ],
  providers: [UsersService, SecurityService, UserUniqueConstraint],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
