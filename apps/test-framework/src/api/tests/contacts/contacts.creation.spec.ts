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

    test(
      '[CNT-001] Successful contact creation',
      {
        tag: '@smoke',
      },
      async ({ api, contactRepository }) => {
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
      },
    );

    [
      {
        testName: '[CNT-002] Contact creation with non-existing ID',
        overrides: { target: { id: utils.random.uuid() } },
        tag: ['@smoke', '@bug'],
      },
      {
        testName: '[CNT-003] Contact creation with empty alias',
        overrides: { alias: '' },
        tag: '@sanity',
      },
      {
        testName: '[CNT-004] Contact creation with alias longer than 255 chars',
        overrides: { alias: utils.random.shortId(256) },
        tag: ['@sanity', '@bug'],
      },
      {
        testName: '[CNT-005] Contact creation without target',
        overrides: { target: undefined },
        tag: '@smoke',
      },
      {
        testName: '[CNT-006] Contact creation without alias',
        overrides: { alias: undefined },
        tag: '@smoke',
      },
    ].forEach(({ testName, overrides, tag }) => {
      test(testName, { tag: tag }, async ({ api }) => {
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

    test(
      '[CNT-007] Create contact duplicates existing',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await api.contacts.createContact({
          target: { id: userB.id! },
          alias: utils.random.alias({ count: 1 }),
        });

        const creationResult = await api.contacts.createContact({
          target: { id: userB.id! },
          alias: utils.random.alias({ count: 1 }),
        });

        expect(creationResult.response).toHaveStatus(409);
      },
    );

    test(
      '[CNT-008] Contact creation without authorization',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        api.contacts.clearTokens();
        const creationResult = await api.contacts.createContact({
          target: { id: userB.id! },
          alias: utils.random.alias({ count: 1 }),
        });

        expect(creationResult.response).toHaveStatus(401);
      },
    );
  },
);
