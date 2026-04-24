import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/groups/unblock-user tests',
  {
    tag: '@groups',
  },
  async () => {
    let owner: UserEntity;
    let blockedUser: UserEntity;
    let secondApi: ApiClientFactory;
    let userGroup: GroupEntity;

    test.beforeEach('Setup owner, group and blocked user', async ({ api, spawnUser, spawnApi }) => {
      owner = await spawnUser();
      await api.auth.login({
        identifier: owner.email,
        password: owner.password,
      });

      userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
      const createResult = await api.groups.createGroup(userGroup);
      userGroup.id = createResult.data.id;
      userGroup.inviteCode = createResult.data.inviteCode;

      blockedUser = await spawnUser();
      secondApi = await spawnApi();
      await secondApi.auth.login({
        identifier: blockedUser.email,
        password: blockedUser.password,
      });
      await secondApi.groups.joinGroup({ code: userGroup.inviteCode });
      await api.groups.blockUser(userGroup.id!, blockedUser.id!);
    });

    test(
      '[GRP-051] Unblock user as owner',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const unblockResult = await api.groups.unblockUser(userGroup.id!, blockedUser.id!);
        expect(unblockResult.response).toHaveStatus(200);
      },
    );

    test(
      '[GRP-052] Join group as unblocked user',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        await api.groups.unblockUser(userGroup.id!, blockedUser.id!);
        const joinResult = await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });
        expect(joinResult.response).toHaveStatus(201); // must be 200
        const group = await api.groups.getGroup(userGroup.id!);
        expect(group.data.members[1].id).toBe(blockedUser.id);
      },
    );

    test(
      '[GRP-053] Unblock user as non-owner of group',
      {
        tag: '@sanity',
      },
      async ({ api, spawnApi, spawnUser }) => {
        const member = await spawnUser();
        const memberApi = await spawnApi();
        await memberApi.auth.login({
          identifier: member.email,
          password: member.password,
        });
        await memberApi.groups.joinGroup({ code: userGroup.inviteCode! });
        const unblockResult = await memberApi.groups.unblockUser(userGroup.id!, blockedUser.id!);
        expect(unblockResult.response).toHaveStatus(403);
      },
    );

    test(
      '[GRP-054] Unblock user without authorization',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        api.groups.clearTokens();
        const unblockResult = await api.groups.unblockUser(userGroup.id!, blockedUser.id!);
        expect(unblockResult.response).toHaveStatus(401);
      },
    );
  },
);
