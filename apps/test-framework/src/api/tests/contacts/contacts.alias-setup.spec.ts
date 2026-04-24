import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { ApiClientFactory } from '../../../core/api/api-client-factory';

test.describe(
  '/api/contacts alias-setup tests',
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

        await api.contacts.createContact({
          target: { id: userB.id! },
          alias: userB.firstName + ' ' + userB.lastName,
        });
      },
    );

    test(
      '[CNT-012] Successful alias setup',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const newAlias = utils.random.alias({ count: 2 });
        const setupAliasResult = await api.contacts.setContactAlias(userB.id!, { alias: newAlias });

        expect(setupAliasResult.response).toHaveStatus(200);
        expect(setupAliasResult.data.alias).toBe(newAlias);
      },
    );

    [
      {
        testName: '[CNT-013] Setup alias with alias longer than 255 chars',
        tag: '@sanity',
        alias: utils.random.shortId(256),
      },
      {
        testName: '[CNT-014] Contact creation without alias',
        tag: ['@sanity', '@bug'],
        alias: '',
      },
    ].forEach((options) => {
      test(options.testName, { tag: options.tag }, async ({ api }) => {
        const setupAliasResult = await api.contacts.setContactAlias(userB.id!, { alias: options.alias });

        expect(setupAliasResult.response).toHaveStatus(400);
      });
    });

    test.fixme(
      '[CNT-015-BUG] Setup alias with non-existing target ID',
      {
        tag: ['@sanity', '@bug'],
      },
      async ({ api }) => {
        const newAlias = utils.random.alias({ count: 2 });
        const setupAliasResult = await api.contacts.setContactAlias(utils.random.uuid(), { alias: newAlias });

        expect(setupAliasResult.response).toHaveStatus(404); // got 500
      },
    );

    test(
      '[CNT-016] Setup alias without authorization',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        api.contacts.clearTokens();

        const newAlias = utils.random.alias({ count: 2 });
        const setupAliasResult = await api.contacts.setContactAlias(userB.id!, { alias: newAlias });

        expect(setupAliasResult.response).toHaveStatus(401);
      },
    );
  },
);
