import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

import { FIREBASE_ADMIN_APP, FIREBASE_FIRESTORE, FIREBASE_MESSAGING } from './firebase.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FIREBASE_ADMIN_APP,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        if (admin.apps.length) return admin.app();

        const projectId = configService.getOrThrow<string>('FIREBASE_PROJECT_ID');
        const clientEmail = configService.getOrThrow<string>('FIREBASE_CLIENT_EMAIL');
        const privateKeyRaw = configService.getOrThrow<string>('FIREBASE_PRIVATE_KEY');
        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        return admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
      },
    },
    {
      provide: FIREBASE_MESSAGING,
      inject: [FIREBASE_ADMIN_APP],
      useFactory: () => admin.messaging(),
    },
    {
      provide: FIREBASE_FIRESTORE,
      inject: [FIREBASE_ADMIN_APP],
      useFactory: () => admin.firestore(),
    },
  ],
  exports: [FIREBASE_ADMIN_APP, FIREBASE_MESSAGING, FIREBASE_FIRESTORE],
})
export class FirebaseModule {}
