import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { ApiClientFactory } from '../../../core/api/api-client-factory';

test.describe(
  '/api/contacts get-all tests',
  {
    tag: '@contacts',
  },
  async () => {
    let userA: UserEntity;
    let userB: UserEntity;
    let secondApi: ApiClientFactory;

    test.beforeEach('Setup two users', async ({ api, spawnUser, spawnApi }) => {
      userA = await spawnUser();
      await api.auth.login({
        identifier: userA.email,
        password: userA.password,
      });

      userB = await spawnUser();
      secondApi = await spawnApi();
      await secondApi.auth.login({
        identifier: userB.email,
        password: userB.password,
      });
    });

    test(
      "[CNT-009] Successful get list of user's contacts",
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const getResult = await api.contacts.getAllContacts();

        expect(getResult.response).toHaveStatus(200);
        expect(getResult.data).not.toBeNull();
        expect(getResult.data).toHaveLength(0);
      },
    );

    test(
      "[CNT-010] Presence of a new contact in a user's contact list",
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        await api.contacts.createContact({
          target: { id: userB.id! },
          alias: utils.random.alias({ count: 1 }),
        });

        const getResult = await api.contacts.getAllContacts();

        expect(getResult.response).toHaveStatus2xx();
        expect(getResult.data).toHaveLength(1);
        expect(getResult.data[0].targetId).toBe(userB.id);
      },
    );

    test(
      "[CNT-011] Get list of user's contacts without authorization",
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        api.contacts.clearTokens();

        const getResult = await api.contacts.getAllContacts();

        expect(getResult.response).toHaveStatus(401);
      },
    );
  },
);
