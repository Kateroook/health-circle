import { timeout } from 'src/utils/wait-helper';
import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  '/api/{id}/roll-call tests',
  {
    tag: ['@user', '@roll-call'],
  },
  async () => {
    let owner: UserEntity;
    let member: UserEntity;
    let nonMember: UserEntity;

    let memberApi: ApiClientFactory;
    let nonMemberApi: ApiClientFactory;

    let ownerGroup: GroupEntity;

    test.setTimeout(120_000);

    test.beforeEach(async ({ spawnUser, spawnApi, api }) => {
      owner = await spawnUser();
      await api.auth.login({ identifier: owner.email, password: owner.password });

      ownerGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
      const createResult = await api.groups.createGroup(ownerGroup);
      ownerGroup.id = createResult.data.id;
      ownerGroup.inviteCode = createResult.data.inviteCode;

      member = await spawnUser();
      memberApi = await spawnApi();
      await memberApi.auth.login({ identifier: member.email, password: member.password });
      await memberApi.groups.joinGroup({ code: ownerGroup.inviteCode! });

      nonMember = await spawnUser();
      nonMemberApi = await spawnApi();
      await nonMemberApi.auth.login({ identifier: nonMember.email, password: nonMember.password });
    });

    [
      {
        testName: '[USR-069] Initiate personal roll-call by owner',
        role: 'owner',
        tag: '@smoke',
        expectedStatus: 201,
      },
      {
        testName: '[USR-070] Initiate personal roll-call by member',
        role: 'member',
        tag: '@smoke',
        expectedStatus: 201,
      },
      {
        testName: '[USR-071] Initiate personal roll-call by non-member',
        role: 'non-member',
        tag: '@sanity',
        expectedStatus: 403,
      },
    ].forEach((options) =>
      test(
        options.testName,
        {
          tag: options.tag,
        },
        async ({ api }) => {
          let currentApi: ApiClientFactory;
          let targetID: string;
          let targetApi: ApiClientFactory;

          if (options.role === 'owner') {
            currentApi = api;
            targetID = member.id!;
            targetApi = memberApi;
          } else if (options.role === 'member') {
            currentApi = memberApi;
            targetID = owner.id!;
            targetApi = api;
          } else {
            currentApi = nonMemberApi;
            targetID = owner.id!;
            targetApi = api;
          }

          if (options.expectedStatus === 201) {
            await utils.wait.sleep(timeout.gracePeriod + timeout.short);
          }

          const rollCallResult = await currentApi.users.initiatePersonalRollCall(targetID);

          expect(rollCallResult.response).toHaveStatus(options.expectedStatus);

          const getUser = await targetApi.users.getUser(targetID);
          if (options.expectedStatus === 201) {
            expect(typeof rollCallResult.data.message).toBe('string');
            expect(rollCallResult.data.message.length).toBeGreaterThan(0);
            expect(getUser.data.lastPersonalRollCallAt).toBeDefined();
          }
          if (options.expectedStatus === 403) {
            expect(getUser.data.lastPersonalRollCallAt).toBeNull();
          }
        },
      ),
    );

    test(
      '[USR-072] Initiate personal roll-call for non-existing user',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const rollCallResult = await api.users.initiatePersonalRollCall(utils.random.uuid());
        expect(rollCallResult.response).toHaveStatus(404);
      },
    );

    test(
      '[USR-073] Personal roll-call spam protection',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await memberApi.users.updateUserStatus({ status: 'SAFE' });

        const rollCallResult = await api.users.initiatePersonalRollCall(member.id!);

        expect(rollCallResult.response).toHaveStatus(201);
        expect(rollCallResult.data.message.length).toBeGreaterThan(0);

        const getUser = await memberApi.users.getUser(member.id!);
        expect(getUser.data.lastPersonalRollCallAt).toBeNull();
      },
    );

    test(
      '[USR-074] Initiate personal roll-call without authorization',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        api.groups.clearTokens();
        const rollCallResult = await api.users.initiatePersonalRollCall(member.id!);
        expect(rollCallResult.response).toHaveStatus(401);
      },
    );

    test(
      '[USR-075] Initiate personal roll-call for yourself',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const rollCallResult = await api.users.initiatePersonalRollCall(owner.id!);
        expect(rollCallResult.response).toHaveStatus(400);
      },
    );

    test(
      "[USR-077] Ignoring personal roll-call changes user's status",
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await memberApi.users.updateUserStatus({ status: 'SAFE' });

        await utils.wait.sleep(timeout.gracePeriod + timeout.short);

        await api.users.initiatePersonalRollCall(member.id!);

        await utils.wait.sleep(timeout.rollCallTimeout + timeout.cronTimeout);

        await expect(async () => {
          const getMemberAfterRC = await memberApi.users.getUser(member.id!);
          expect(getMemberAfterRC.data.status).toBe('UNKNOWN');
        }).toPass({ timeout: timeout.cronTimeout * 5, intervals: [timeout.medium, timeout.long] }); //TODO: adjust intervals after api fix
      },
    );

    test(
      "[USR-078] Personal roll-call doesn't changes user's status after imidiate response",
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await utils.wait.sleep(timeout.gracePeriod + timeout.short);
        await api.users.initiatePersonalRollCall(member.id!);
        await memberApi.users.updateUserStatus({ status: 'SAFE' });

        await utils.wait.sleep(timeout.rollCallTimeout - timeout.extraLong);

        const getMemberAfterRC = await memberApi.users.getUser(member.id!);

        expect(getMemberAfterRC.data.status).toBe('SAFE');
      },
    );
  },
);
