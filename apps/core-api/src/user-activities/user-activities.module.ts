import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserActivityEntity } from './entities/user-activities.entity';
import { UserActivityTypeEntity } from './entities/user-activity-type.entity';
import { UserActivitiesService } from './user-activities.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserActivityEntity, UserActivityTypeEntity])],
  providers: [UserActivitiesService],
  exports: [UserActivitiesService],
})
export class UserActivitiesModule {}
