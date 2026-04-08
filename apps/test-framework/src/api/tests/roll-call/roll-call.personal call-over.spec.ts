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
        testName: '[RC-006] Initiate personal roll-call by owner',
        role: 'owner',
        tag: '@smoke',
        expectedStatus: 201,
        shouldUpdateDate: true,
      },
      {
        testName: '[RC-007] Initiate personal roll-call by member',
        role: 'member',
        tag: '@smoke',
        expectedStatus: 201,
        shouldUpdateDate: true,
      },
      {
        testName: '[RC-008] Initiate personal roll-call by non-member',
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
          let memberID: string = owner.id!;
          if (options.role === 'owner') {
            currentApi = api;
            memberID = member.id!;
          } else if (options.role === 'member') currentApi = memberApi;
          else currentApi = nonMemberApi;

          const rollCallResult = await currentApi.rollCall.initiateForMember(ownerGroup.id!, memberID!);

          expect(rollCallResult.response.status()).toBe(options.expectedStatus);

          // const getUser = await api.users.getUser(memberID);
          // if (options.shouldUpdateDate) expect(getUser.data.lastPersonalRollCallAt).not.toBeNull;
          // else expect(getUser.data.lastPersonalRollCallAt).toBeNull;
        },
      ),
    );

    test(
      '[RC-009] Personal roll-call for user NOT in group',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const rollCallResult = await api.rollCall.initiateForMember(ownerGroup.id!, nonMember.id!);
        expect(rollCallResult.response.status()).toBe(404);
      },
    );

    test(
      '[RC-010] Personal roll-call spam protection',
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
  },
);
