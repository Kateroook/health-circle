import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreSyncService {
  private readonly logger = new Logger(FirestoreSyncService.name);

  async sendSyncSignal(userIds: string | string[]) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) return;

    try {
      // Firestore batch writes are limited (currently 500 ops per batch)
      const chunkSize = 500;
      for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        const chunk = uniqueIds.slice(i, i + chunkSize);
        const batch = admin.firestore().batch();
        chunk.forEach((id) => {
          const ref = admin.firestore().collection('user_sync').doc(id);
          batch.set(ref, { timestamp: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        });
        await batch.commit();
      }
      this.logger.debug(`Sync signal sent to ${uniqueIds.length} users`);
    } catch (error) {
      this.logger.error(`Error sending firestore sync signals: ${error}`);
    }
  }
}
