import { test as base, mergeExpects } from '@playwright/test';
import { Kysely } from 'kysely';
import { ApiClientFactory } from '../../core/api/api-client-factory';
import { expect as statusExpect } from '../../core/api/helpers/response-checker';
import { BackendProvider } from '../../core/backend-provider';
import { DbCleaner } from '../../core/db/db-cleaner';
import { DbManager } from '../../core/db/db-manager';
import { ConfirmationCodeRepository } from '../../core/db/repositories/confirmation-code-repository';
import { ContactRepository } from '../../core/db/repositories/contact-repository';
import { GroupRepository } from '../../core/db/repositories/group-repository';
import { UserRepository } from '../../core/db/repositories/user-repository';
import { Database } from '../../core/db/schema';
import { UserEntity } from '../../core/types/entites/user-interface';
export type ApiFixture = {
  db: Kysely<Database>;
};
export const workerTest = base.extend<{}, ApiFixture>({
  db: [
    async ({}, use) => {
      const client = await DbManager.getInstance();
      await use(client);
      await client.destroy();
    },
    { scope: 'worker', auto: true },
  ],
});

export type MyFixture = {
  backendProvider: BackendProvider;
  userRepository: UserRepository;
  groupRepository: GroupRepository;
  contactRepository: ContactRepository;
  confirmationCodeRepository: ConfirmationCodeRepository;
  dbCleaner: DbCleaner;
  api: ApiClientFactory;
  spawnApi: () => Promise<ApiClientFactory>;
  spawnUser: (overrides?: Partial<UserEntity>) => Promise<UserEntity>;
};

export const test = workerTest.extend<MyFixture>({
  backendProvider: async ({ db, request }, use) => {
    const provider = await BackendProvider.init(db, request);
    await use(provider);
    await provider.cleanup();
    await provider.dispose();
  },
  dbCleaner: async ({ backendProvider }, use) => {
    await use(backendProvider.dbCleaner);
  },
  userRepository: async ({ backendProvider }, use) => {
    await use(backendProvider.userRepository);
  },
  groupRepository: async ({ backendProvider }, use) => {
    await use(backendProvider.groupRepository);
  },
  contactRepository: async ({ backendProvider }, use) => {
    await use(backendProvider.contactRepository);
  },
  confirmationCodeRepository: async ({ backendProvider }, use) => {
    await use(backendProvider.confirmationCodeRepository);
  },

  api: async ({ backendProvider }, use) => {
    await use(backendProvider.api);
  },

  spawnApi: async ({ backendProvider }, use) => {
    await use(() => backendProvider.spawnApi());
  },

  spawnUser: async ({ backendProvider }, use) => {
    await use(() => backendProvider.spawnUser());
  },
});

export const expect = mergeExpects(statusExpect);
