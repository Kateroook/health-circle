import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsModule } from 'src/contacts/contacts.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { SecurityModule } from 'src/security/security.module';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

import { GroupEntity } from './entities/group.entity';
import { GroupBlockListEntity } from './entities/group-block-list.entity';
import { GroupMemberEntity } from './entities/group-member.entity';
import { GroupController } from './groups.controller';
import { GroupService } from './groups.service';
import { StatusQueueService } from './status-queue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupEntity, UserEntity, GroupBlockListEntity, GroupMemberEntity]),
    SecurityModule,
    ContactsModule,
    NotificationsModule,
    UsersModule,
  ],
  providers: [GroupService, StatusQueueService],
  controllers: [GroupController],
})
export class GroupsModule {}
