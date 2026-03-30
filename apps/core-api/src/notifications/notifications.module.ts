import { Module } from '@nestjs/common';

import { FirebaseModule } from '../firebase/firebase.module';
import { FirestoreSyncService } from './firestore-sync.service';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [FirebaseModule],
  providers: [NotificationsService, FirestoreSyncService],
  exports: [NotificationsService, FirestoreSyncService],
})
export class NotificationsModule {}
