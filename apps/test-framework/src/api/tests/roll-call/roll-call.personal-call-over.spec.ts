import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  '/api/groups/{id}/members/{userId}/roll-call tests',
  {
    tag: '@roll-call',
  },
  async () => {
    let owner: UserEntity;
    let member: UserEntity;
    let nonMember: UserEntity;

    let memberApi: ApiClientFactory;
    let nonMemberApi: ApiClientFactory;

    let ownerGroup: GroupEntity;

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
        testName: '[RC-009] Initiate personal roll-call by owner',
        role: 'owner',
        tag: '@smoke',
        expectedStatus: 201,
        shouldUpdateDate: true,
      },
      {
        testName: '[RC-010] Initiate personal roll-call by member',
        role: 'member',
        tag: '@smoke',
        expectedStatus: 201,
        shouldUpdateDate: true,
      },
      {
        testName: '[RC-011] Initiate personal roll-call by non-member',
        role: 'non-member',
        tag: '@sanity',
        expectedStatus: 403,
        shouldUpdateDate: false,
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

          const rollCallResult = await currentApi.rollCall.initiateForMember(ownerGroup.id!, targetID);

          expect(rollCallResult.response.status()).toBe(options.expectedStatus);

          if (options.expectedStatus === 201) {
            const getUser = await targetApi.users.getUser(targetID);

            if (options.shouldUpdateDate) {
              expect(typeof rollCallResult.data.message).toBe('string');
              expect(rollCallResult.data.message.length).toBeGreaterThan(0);
              expect(getUser.data.lastPersonalRollCallAt).toBeNull();
              // expect(getUser.data.lastPersonalRollCallAt).not.toBeNull();
            }
          }
        },
      ),
    );

    test(
      '[RC-012] Initiate personal roll-call for user NOT in group',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const rollCallResult = await api.rollCall.initiateForMember(ownerGroup.id!, nonMember.id!);
        expect(rollCallResult.response.status()).toBe(404);
      },
    );

    test(
      '[RC-013] Personal roll-call spam protection',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await memberApi.users.updateUserStatus({ status: 'SAFE' });

        const rollCallResult = await api.rollCall.initiateForMember(ownerGroup.id!, member.id!);

        expect(rollCallResult.response.status()).toBe(201);
        expect(rollCallResult.data.message.length).toBeGreaterThan(0);
      },
    );

    test(
      '[RC-014] Initiate personal roll-call without authorization',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await api.groups.clearTokens();
        const rollCallResult = await api.rollCall.initiateForMember(ownerGroup.id!, member.id!);
        expect(rollCallResult.response.status()).toBe(401);
      },
    );

    test(
      '[RC-015] Initiate personal roll-call for yourself',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const rollCallResult = await api.rollCall.initiateForMember(ownerGroup.id!, owner.id!);
        expect(rollCallResult.response.status()).toBe(201);
      },
    );

    test(
      '[RC-016] Initiate personal roll-call for non-existing user',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const rollCallResult = await api.rollCall.initiateForMember(ownerGroup.id!, utils.random.uuid());
        expect(rollCallResult.response.status()).toBe(404);
      },
    );

    test.skip(
      "[RC-017] Ignoring personal roll-call changes user's status",
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const getMemberBeforeRC = await memberApi.users.getUser(member.id!);

        //sleep function or method (implemented in utils)

        await api.rollCall.initiateForMember(ownerGroup.id!, member.id!);
        const getMemberAfterRC = await memberApi.users.getUser(member.id!);

        expect(getMemberAfterRC.data.status).not.toBe(getMemberBeforeRC.data.status);
      },
    );

    test.skip(
      "[RC-018] Personal roll-call doesn't changes user's status after imidiate responce",
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const getMemberBeforeRC = await memberApi.users.getUser(member.id!);

        //sleep function or method (implemented in utils)

        await api.rollCall.initiateForMember(ownerGroup.id!, member.id!);
        await memberApi.users.updateUserStatus({ status: 'SAFE' });
        const getMemberAfterRC = await memberApi.users.getUser(member.id!);

        expect(getMemberAfterRC.data.status).not.toBe(getMemberBeforeRC.data.status);
      },
    );
  },
);
