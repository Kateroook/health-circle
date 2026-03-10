import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreSyncService {
  private readonly logger = new Logger(FirestoreSyncService.name);

  async sendSyncSignal(userIds: string | string[]) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) return;

    try {
      const batch = admin.firestore().batch();
      ids.forEach((id) => {
        const ref = admin.firestore().collection('user_sync').doc(id);
        batch.set(ref, { timestamp: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      });
      await batch.commit();
      this.logger.debug(`Sync signal sent to ${ids.length} users`);
    } catch (error) {
      this.logger.error(`Error sending firestore sync signals: ${error}`);
    }
  }
}
