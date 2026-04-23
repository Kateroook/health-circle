import { timeout } from 'src/utils/wait-helper';
import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  '/api/groups/{id}/roll-call tests',
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
        testName: '[GRP-058] Initiate group roll-call by owner',
        role: 'owner',
        expectedStatus: 201,
        tag: '@smoke',
        shouldUpdateDate: true,
      },
      {
        testName: '[GRP-059] Initiate group roll-call by member',
        role: 'member',
        expectedStatus: 201,
        tag: '@smoke',
        shouldUpdateDate: true,
      },
      {
        testName: '[GRP-060] Initiate group roll-call by non-member',
        role: 'non-member',
        expectedStatus: 403,
        tag: '@sanity',
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
          if (options.role === 'owner') currentApi = api;
          else if (options.role === 'member') currentApi = memberApi;
          else currentApi = nonMemberApi;

          const rollCallResult = await currentApi.groups.initiateGroupRollCall(ownerGroup.id!);

          expect(rollCallResult.response).toHaveStatus(options.expectedStatus);

          const updatedGroupRes = await api.groups.getGroup(ownerGroup.id!);

          if (options.shouldUpdateDate) {
            expect(updatedGroupRes.data.lastRollCallAt).toBeDefined();
          } else {
            expect(updatedGroupRes.data.lastRollCallAt).toBeNull();
          }
        },
      ),
    );

    test(
      '[GRP-061] Initiate group roll-call for non-existing group',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const roll_callResult = await api.groups.initiateGroupRollCall(utils.random.uuid());
        expect(roll_callResult.response).toHaveStatus(404);
      },
    );

    test(
      '[GRP-062] Initiate group roll-call without authorization',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await api.groups.clearTokens();
        const roll_callResult = await api.groups.initiateGroupRollCall(utils.random.uuid.toString());
        expect(roll_callResult.response).toHaveStatus(401);
      },
    );

    test(
      '[GRP-063] Initiate group roll-call in an empty group',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const secondOwnerGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
        const createResult = await api.groups.createGroup(secondOwnerGroup);
        secondOwnerGroup.id = createResult.data.id;
        secondOwnerGroup.inviteCode = createResult.data.inviteCode;

        const roll_callResult = await api.groups.initiateGroupRollCall(secondOwnerGroup.id!);
        expect(roll_callResult.response).toHaveStatus(201);
      },
    );

    test(
      "[GRP-064] Ignoring group call changes user's status",
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await memberApi.users.updateUserStatus({ status: 'SAFE' });

        await api.groups.initiateGroupRollCall(ownerGroup.id!);

        await utils.wait.sleep(timeout.rollCallTimeout + timeout.cronTimeout);

        await expect(async () => {
          const getMemberAfterRC = await memberApi.users.getUser(member.id!);
          console.log('User status after roll-call:', getMemberAfterRC.data.status);
          expect(getMemberAfterRC.data.status).toBe('UNKNOWN');
        }).toPass({ timeout: timeout.cronTimeout * 3, intervals: [timeout.medium, timeout.long] }); //TODO: adjust intervals after api fix
      },
    );

    test(
      "[GRP-065] Group call doesn't changes user\'s status after imidiate response",
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await api.groups.initiateGroupRollCall(ownerGroup.id!);

        await memberApi.users.updateUserStatus({ status: 'SAFE' });

        await utils.wait.sleep(timeout.rollCallTimeout - timeout.extraLong);

        const getMemberAfterRC = await memberApi.users.getUser(member.id!);

        expect(getMemberAfterRC.data.status).toBe('SAFE');
      },
    );
  },
);
