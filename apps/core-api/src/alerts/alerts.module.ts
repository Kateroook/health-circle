import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QueueModule } from '../common/queue/queue.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserEntity } from '../users/entities/user.entity';
import { AlertRegionResolverService } from './alert-region-resolver.service';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsRegionEntity } from './entities/alerts-region.entity';
import { HdxHromadaEntity } from './entities/hdx-hromada.entity';
import { GeocodingTestController } from './geocoding-test.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertsRegionEntity, UserEntity, HdxHromadaEntity]),
    NotificationsModule,
    QueueModule,
    GeocodingModule,
  ],
  providers: [AlertsService, AlertRegionResolverService],
  controllers: [AlertsController, GeocodingTestController],
  exports: [AlertsService, AlertRegionResolverService],
})
export class AlertsModule {}
