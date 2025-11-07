import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserActivityEntity } from 'src/common/entities/user-activities.entity';
import { UserActivitiesService } from './user-activities.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserActivityEntity])],
  providers: [UserActivitiesService],
  exports: [UserActivitiesService],
})
export class UserActivitiesModule {}
