import { APIRequestContext, test as base, expect as baseExpect, mergeExpects } from '@playwright/test';
import { DbManager } from '../../core/db/db-manager';
import { UserRepository } from '../../core/db/repositories/user-repository';
import { GroupRepository } from '../../core/db/repositories/group-repository';
import { ContactRepository } from '../../core/db/repositories/contact-repository';
import { ConfirmationCodeRepository } from '../../core/db/repositories/confirmation-code-repository';
import { DbCleaner } from '../../core/db/db-cleaner';
import { ApiClientFactory } from '../../core/api/api-client-factory';
import { Kysely } from 'kysely';
import { Database } from '../../core/db/schema';
import { UserEntity } from '../../core/types/entites/user-interface';
import { UserFactory } from '../../core/data/factories/user-factory';
import { expect as statusExpect } from '../../core/api/helpers/response-checker';
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
  dbCleaner: async ({ db: dbClient }, use) => {
    const dbCleaner = new DbCleaner(dbClient);
    await use(dbCleaner);
    await dbCleaner.cleanup();
  },
  userRepository: async ({ db: dbClient, dbCleaner }, use) => {
    await use(new UserRepository(dbClient, dbCleaner));
  },
  groupRepository: async ({ db: dbClient, dbCleaner }, use) => {
    await use(new GroupRepository(dbClient, dbCleaner));
  },
  contactRepository: async ({ db: dbClient, dbCleaner }, use) => {
    await use(new ContactRepository(dbClient, dbCleaner));
  },
  confirmationCodeRepository: async ({ db: dbClient, dbCleaner }, use) => {
    await use(new ConfirmationCodeRepository(dbClient, dbCleaner));
  },

  api: async ({ dbCleaner, request }, use) => {
    const api = new ApiClientFactory({
      request: request,
      dbCleaner: dbCleaner,
    });
    await use(api);
  },

  spawnApi: async ({ playwright, dbCleaner }, use) => {
    const contexts: APIRequestContext[] = [];

    const spawn = async () => {
      const context = await playwright.request.newContext();
      contexts.push(context);

      return new ApiClientFactory({
        request: context,
        dbCleaner: dbCleaner,
      });
    };

    await use(spawn);

    for (const context of contexts) {
      await context.dispose();
    }
  },

  spawnUser: async ({ api, confirmationCodeRepository }, use) => {
    const factory = async (overrides?: Partial<UserEntity>) => {
      let user = UserFactory.createRandomUser(overrides);

      const postUser = await api.users.createUser({
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
      });
      statusExpect(postUser.response).toHaveStatus2xx();
  
      user.id = postUser.data.id;

      const code = (await confirmationCodeRepository.findBy({ userId: user.id }))[0];

      console.log(code);

      baseExpect(code).not.toBeUndefined();
      baseExpect(code).not.toBeNull();
  
      const setupPassword = await api.auth.setupPassword(user.email!, code.code, {
        newPassword: user.password,
        confirmNewPassword: user.password,
      });

      statusExpect(setupPassword.response).toHaveStatus2xx();

      return user;
    };

    await use(factory);
  },
});

export const expect = mergeExpects(statusExpect);
