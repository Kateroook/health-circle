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
        testName: '[RC-001] Initiate group roll-call by owner',
        role: 'owner',
        expectedStatus: 201,
        tag: '@smoke',
        shouldUpdateDate: true,
      },
      {
        testName: '[RC-002] Initiate group roll-call by member',
        role: 'member',
        expectedStatus: 201,
        tag: '@smoke',
        shouldUpdateDate: true,
      },
      {
        testName: '[RC-003] Initiate group roll-call by non-member',
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

          const rollCallResult = await currentApi.rollCall.initiateForGroup(ownerGroup.id!);

          expect(rollCallResult.response.status()).toBe(options.expectedStatus);

          const updatedGroupRes = await api.groups.getGroup(ownerGroup.id!);

          if (options.shouldUpdateDate) {
            expect(updatedGroupRes.data.lastRollCallAt).not.toBeNull();
          } else {
            expect(updatedGroupRes.data.lastRollCallAt).toBeNull();
          }
        },
      ),
    );

    test(
      '[RC-004] Initiate group roll-call for non-existing group',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const roll_callResult = await api.rollCall.initiateForGroup(utils.random.uuid());
        expect(roll_callResult.response.status()).toBe(404);
      },
    );

    test(
      '[RC-005] Initiate group roll-call without authorization',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await api.groups.clearTokens();
        const roll_callResult = await api.rollCall.initiateForGroup(utils.random.uuid.toString());
        expect(roll_callResult.response.status()).toBe(401);
      },
    );
  },
);
