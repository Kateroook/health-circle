import { Inject, Injectable, Logger } from '@nestjs/common';
import { firestore as firebaseFirestoreAdmin, type firestore } from 'firebase-admin';

import { FIREBASE_FIRESTORE } from '../firebase/firebase.constants';

@Injectable()
export class FirestoreSyncService {
  private readonly logger = new Logger(FirestoreSyncService.name);

  constructor(@Inject(FIREBASE_FIRESTORE) private readonly firebaseFirestore: firestore.Firestore) {}

  async sendSyncSignal(userIds: string | string[]) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) return;

    try {
      // Firestore batch writes are limited (currently 500 ops per batch)
      const chunkSize = 500;
      for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        const chunk = uniqueIds.slice(i, i + chunkSize);
        const batch = this.firebaseFirestore.batch();
        chunk.forEach((id) => {
          const ref = this.firebaseFirestore.collection('user_sync').doc(id);
          batch.set(ref, { timestamp: firebaseFirestoreAdmin.FieldValue.serverTimestamp() }, { merge: true });
        });
        await batch.commit();
      }
      this.logger.debug(`Sync signal sent to ${uniqueIds.length} users`);
    } catch (error) {
      this.logger.error(`Error sending firestore sync signals: ${error}`);
    }
  }
}
