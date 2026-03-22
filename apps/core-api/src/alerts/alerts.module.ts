import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QueueModule } from '../common/queue/queue.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserEntity } from '../users/entities/user.entity';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsRegionEntity } from './entities/alerts-region.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AlertsRegionEntity, UserEntity]), NotificationsModule, QueueModule],
  providers: [AlertsService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
