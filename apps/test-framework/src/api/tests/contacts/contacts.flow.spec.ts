import { expect, test } from '../../fixtures/api-fixture';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { utils } from '../../../utils/utils';

test.describe(
  '/api/contacts e2e flow tests',
  {
    tag: '@contacts',
  },
  async () => {
    let userA: UserEntity;
    let userB: UserEntity;
    let secondApi: ApiClientFactory;

    test.beforeEach(
      'Setup User A and User B and add User B to contacts of User A',
      async ({ api, spawnUser, spawnApi }) => {
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
      },
    );

    test('[CNT-E2E-001] Contact full life cycle', async ({ api }) => {
      const creationResult = await api.contacts.createContact({
        target: { id: userB.id! },
        alias: utils.random.alias({ count: 2 }),
      });
      expect(creationResult.response).toHaveStatus2xx();

      const getResult1 = await api.contacts.getAllContacts();
      expect(getResult1.data[0].targetId).toBe(userB.id);

      const newAlias = utils.random.alias({ count: 2 });
      await api.contacts.setContactAlias(userB.id!, { alias: newAlias });

      const getResult2 = await api.contacts.getAllContacts();
      expect(getResult2.data[0].alias).toBe(newAlias);

      await api.contacts.deleteContact(userB.id!);
      const getContactById = await api.contacts.findContactByTargetId(userB.id!);
      const apiGetContact = await api.contacts.getAllContacts();

      expect(getContactById).toBeNull();
      expect(apiGetContact.data).toHaveLength(0);
    });

    test.fixme('[CNT-E2E-002-BUG] Contact has appropriate values after creating', async ({ api }) => {
      // BUG: The GET /api/contacts response does not include the target user's details
      // (firstName, lastName). It only returns the ContactEntity.

      const creationResult = await api.contacts.createContact({
        target: { id: userB.id! },
        alias: utils.random.alias({ count: 2 }),
      });
      expect(creationResult.response).toHaveStatus2xx();

      const getResult1 = await api.contacts.getAllContacts();
      expect(getResult1.data[0].targetId).toBe(userB.id);
    });
  },
);
