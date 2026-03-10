import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupEntity } from 'src/common/entities/group.entity';
import { GroupBlockListEntity } from 'src/common/entities/group-block-list.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { ContactsModule } from 'src/contacts/contacts.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { SecurityModule } from 'src/security/security.module';

import { GroupController } from './groups.controller';
import { GroupService } from './groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupEntity, UserEntity, GroupBlockListEntity]),
    SecurityModule,
    ContactsModule,
    NotificationsModule,
  ],
  providers: [GroupService],
  controllers: [GroupController],
})
export class GroupsModule {}
