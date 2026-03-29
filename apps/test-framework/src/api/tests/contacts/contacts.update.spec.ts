import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { ApiClientFactory } from '../../../core/api/api-client-factory';

test.describe('/api/contacts update tests', async () => {
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

      await api.contacts.createContact({
        target: { id: userB.id! },
        alias: userB.firstName + ' ' + userB.lastName,
      });
    },
  );

  test('[CNT-017] Successful contact update', async ({ api, contactRepository }) => {
    const newAlias = utils.random.alias({ count: 2 });
    const updateResult = await api.contacts.updateContact(userB.id!, { alias: newAlias });

    expect(updateResult.response).toHaveStatus(200);
    expect(updateResult.data.alias).toBe(newAlias);

    const dbContacts = await contactRepository.findBy({ ownerId: userA.id });
    expect(dbContacts[0].alias).toBe(newAlias);
  });

  test('[CNT-018] Contact update with non-existing target ID', async ({ api }) => {
    const newAlias = utils.random.alias({ count: 2 });
    const updateResult = await api.contacts.updateContact(utils.random.uuid(), { alias: newAlias });

    expect(updateResult.response).toHaveStatus(404);
  });

  test('[CNT-019] Contact update without authorization', async ({ api }) => {
    api.contacts.clearTokens();
    const newAlias = utils.random.alias({ count: 2 });
    const updateResult = await api.contacts.updateContact(userB.id!, { alias: newAlias });

    expect(updateResult.response).toHaveStatus(401);
  });
});
