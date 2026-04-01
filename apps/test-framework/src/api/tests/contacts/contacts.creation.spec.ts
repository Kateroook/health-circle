import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { ApiClientFactory } from '../../../core/api/api-client-factory';

test.describe(
  '/api/contacts creation tests',
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

    test('[CNT-001] Successful contact creation', async ({ api, contactRepository }) => {
      const userAlias = utils.random.alias({ count: 1 });
      const creationResult = await api.contacts.createContact({
        target: { id: userB.id! },
        alias: userAlias,
      });

      expect(creationResult.response).toHaveStatus(201);
      expect(creationResult.data.targetId).toBe(userB.id);
      expect(creationResult.data.alias).toBe(userAlias);
      expect(creationResult.data.ownerId).toBe(userA.id);

      const contactRowDb = await contactRepository.findBy({ ownerId: userA.id });
      expect(contactRowDb).toHaveLength(1);
      expect(contactRowDb[0].alias).toBe(userAlias);
      expect(contactRowDb[0].targetId).toBe(userB.id);
    });

    test.fixme('[CNT-002-BUG] Contact creation with non-existing ID', async ({ api }) => {
      const nonExistingId = utils.random.uuid();
      const creationResult = await api.contacts.createContact({
        target: { id: nonExistingId },
        alias: utils.random.alias({ count: 1 }),
      });

      expect(creationResult.response).toHaveStatus(404);
      expect(creationResult.data).toBeUndefined();
    });

    test.fixme('[CNT-004-BUG] Contact creation with alias longer than 255 chars', async ({ api }) => {
      const creationResult = await api.contacts.createContact({
        target: { id: userB.id! },
        alias: utils.random.shortId(256),
      });

      expect(creationResult.response).toHaveStatus(400);
    });

    [
      // {
      //   testName: '[CNT-002] Contact creation with non-existing ID',
      //   overrides: { target: { id: utils.random.uuid() } },
      // },
      {
        testName: '[CNT-003] Contact creation with empty alias',
        overrides: { alias: '' },
      },
      // {
      //   testName: '[CNT-004] Contact creation with alias longer than 255 chars',
      //   overrides: { alias: utils.random.shortId(256) },
      // },
      {
        testName: '[CNT-005] Contact creation without target',
        overrides: { target: undefined },
      },
      {
        testName: '[CNT-006] Contact creation without alias',
        overrides: { alias: undefined },
      },
    ].forEach(({ testName, overrides }) => {
      test(testName, async ({ api }) => {
        const defaultPayload = {
          target: { id: userB.id! },
          alias: utils.random.alias({ count: 1 }),
        };

        const payload = {
          ...defaultPayload,
          ...overrides,
        };

        const creationResult = await api.contacts.createContact(payload as any);

        expect(creationResult.response).toHaveStatus(400);
      });
    });

    test('[CNT-007] Create contact duplicates existing', async ({ api }) => {
      await api.contacts.createContact({
        target: { id: userB.id! },
        alias: utils.random.alias({ count: 1 }),
      });

      const creationResult = await api.contacts.createContact({
        target: { id: userB.id! },
        alias: utils.random.alias({ count: 1 }),
      });

      expect(creationResult.response).toHaveStatus(409);
    });

    test('[CNT-008] Contact creation without authorization', async ({ api }) => {
      api.contacts.clearTokens();
      const creationResult = await api.contacts.createContact({
        target: { id: userB.id! },
        alias: utils.random.alias({ count: 1 }),
      });

      expect(creationResult.response).toHaveStatus(401);
    });
  },
);
