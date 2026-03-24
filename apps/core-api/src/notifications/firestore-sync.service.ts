import { Inject, Injectable, Logger } from '@nestjs/common';
import { firestore as firebaseFirestoreAdmin, type firestore } from 'firebase-admin';

import { FIREBASE_FIRESTORE } from '../firebase/firebase.constants';

@Injectable()
export class FirestoreSyncService {
  private readonly logger = new Logger(FirestoreSyncService.name);

  constructor(@Inject(FIREBASE_FIRESTORE) private readonly firebaseFirestore: firestore.Firestore) {}

  async sendSyncSignal(userIds: string | string[]) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) return;

    try {
      const batch = this.firebaseFirestore.batch();
      ids.forEach((id) => {
        const ref = this.firebaseFirestore.collection('user_sync').doc(id);
        batch.set(ref, { timestamp: firebaseFirestoreAdmin.FieldValue.serverTimestamp() }, { merge: true });
      });
      await batch.commit();
      this.logger.debug(`Sync signal sent to ${ids.length} users`);
    } catch (error) {
      this.logger.error(`Error sending firestore sync signals: ${error}`);
    }
  }
}
