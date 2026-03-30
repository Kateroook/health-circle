import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserUniqueConstraint } from 'src/common/constraints/user-unique.constraint';
import { ConfirmationsModule } from 'src/confirmations/confirmations.module';
import { ContactEntity } from 'src/contacts/entities/contact.entity';
import { ExternalFilesModule } from 'src/external-files/external-files.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { StatusUpdateQueueWorker } from 'src/notifications/status-update-queue.worker';
import { UserActivitiesModule } from 'src/user-activities/user-activities.module';

import { GroupEntity } from '../groups/entities/group.entity';
import { GroupBlockListEntity } from '../groups/entities/group-block-list.entity';
import { GroupMemberEntity } from '../groups/entities/group-member.entity';
import { UserEntity } from './entities/user.entity';
import { UserNotificationSettingsEntity } from './entities/user-notification-settings.entity';
import { UserPasswordEntity } from './entities/user-password.entity';
import { UserSessionEntity } from './entities/user-sessions.entity';
import { SessionActivityService } from './session-activity.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserPasswordEntity,
      UserSessionEntity,
      GroupEntity,
      GroupBlockListEntity,
      GroupMemberEntity,
      ContactEntity,
      UserNotificationSettingsEntity,
    ]),
    UserActivitiesModule,
    ConfirmationsModule,
    ExternalFilesModule,
    NotificationsModule,
  ],
  providers: [UsersService, UserUniqueConstraint, SessionActivityService, StatusUpdateQueueWorker],
  controllers: [UsersController],
  exports: [UsersService, SessionActivityService],
})
export class UsersModule {}
