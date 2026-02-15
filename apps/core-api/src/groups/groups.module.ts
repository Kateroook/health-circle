import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupEntity } from 'src/common/entities/group.entity';
import { GroupBlockListEntity } from 'src/common/entities/group-block-list.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { ContactsModule } from 'src/contacts/contacts.module';
import { SecurityModule } from 'src/security/security.module';

import { GroupController } from './groups.controller';
import { GroupService } from './groups.service';

@Module({
  imports: [TypeOrmModule.forFeature([GroupEntity, UserEntity, GroupBlockListEntity]), SecurityModule, ContactsModule],
  providers: [GroupService],
  controllers: [GroupController],
})
export class GroupsModule {}
