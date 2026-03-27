import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { ApiClientFactory } from '../../../core/api/api-client-factory';
import crypto from 'crypto';

test.describe('/api/contacts alias-setup tests', async () => {
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

  test('[CNT-012] Successful alias setup', async ({ api }) => {
    const newAlias = utils.random.alias({ count: 2 });
    const setupAliasResult = await api.contacts.setContactAlias(userB.id!, { alias: newAlias });

    expect(setupAliasResult.response).toHaveStatus(200);
    expect(setupAliasResult.data.alias).toBe(newAlias);
  });

  test.fixme('[CNT-014-BUG] Contact creation without alias', async ({ api }) => {
    // BUG: Passing an empty string ('') as an alias unexpectedly returns 200 OK
    // and completely deletes the contact from the database.
    // Expected behavior: validation error (400 Bad Request).

    const newAlias = '';
    const setupAliasResult = await api.contacts.setContactAlias(userB.id!, { alias: newAlias });

    console.log('Responce', setupAliasResult.response);
    console.log('Data', setupAliasResult.data);
    expect(setupAliasResult.response).toHaveStatus(400); //but got 200
  });

  [
    {
      testName: '[CNT-013] Setup alias with alias longer than 255 chars',
      alias: utils.random.shortId(256),
    },
    // {
    //   testName: '[CNT-014] Contact creation without alias',
    //   alias: '',
    // },
  ].forEach((options) => {
    test(options.testName, async ({ api }) => {
      const setupAliasResult = await api.contacts.setContactAlias(userB.id!, { alias: options.alias });

      expect(setupAliasResult.response).toHaveStatus(400);
    });
  });

  test.fixme('[CNT-015-BUG] Setup alias with non-existing target ID', async ({ api }) => {
    const newAlias = utils.random.alias({ count: 2 });
    const setupAliasResult = await api.contacts.setContactAlias(crypto.randomUUID(), { alias: newAlias });

    expect(setupAliasResult.response).toHaveStatus(404); // got 500
  });

  test('[CNT-016] Setup alias without authorization', async ({ api }) => {
    api.contacts.clearTokens();

    const newAlias = utils.random.alias({ count: 2 });
    const setupAliasResult = await api.contacts.setContactAlias(userB.id!, { alias: newAlias });

    expect(setupAliasResult.response).toHaveStatus(401);
  });
});
