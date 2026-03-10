import { Module } from '@nestjs/common';

import { FirestoreSyncService } from './firestore-sync.service';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [NotificationsService, FirestoreSyncService],
  exports: [NotificationsService, FirestoreSyncService],
})
export class NotificationsModule {}
