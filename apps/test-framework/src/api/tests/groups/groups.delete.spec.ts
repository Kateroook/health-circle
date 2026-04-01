import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/groups/delete tests',
  {
    tag: '@groups',
  },
  async () => {
    let groupOwner: UserEntity;
    let userGroup: GroupEntity;

    test.beforeEach('Setup user and group', async ({ api, spawnUser }) => {
      groupOwner = await spawnUser();

      await api.auth.login({
        identifier: groupOwner.email,
        password: groupOwner.password,
      });

      userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
      const initialGroupResult = await api.groups.createGroup(userGroup);
      userGroup.id = initialGroupResult.data.id;
      userGroup.inviteCode = initialGroupResult.data.inviteCode;
    });

    test(
      '[GRP-022] Successful delete group by owner',
      {
        tag: '@smoke',
      },
      async ({ api, groupRepository }) => {
        const deleteResult = await api.groups.deleteGroup(userGroup.id!);

        expect(deleteResult.response).toHaveStatus(200);

        const groupInDb = await groupRepository.getById(userGroup.id!);
        expect(groupInDb).toBeNull();
      },
    );

    test(
      '[GRP-023] Deleted group disappears from GET /api/groups',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        let allGroupsResult = await api.groups.getAllGroups();
        expect(allGroupsResult.data).toHaveLength(1);

        await api.groups.deleteGroup(userGroup.id!);

        allGroupsResult = await api.groups.getAllGroups();
        expect(allGroupsResult.data).toHaveLength(0);
      },
    );

    test(
      '[GRP-024] Delete group by non-owner member',
      {
        tag: '@sanity',
      },
      async ({ api, spawnUser }) => {
        const secondUser = await spawnUser();
        await api.auth.login({
          identifier: secondUser.email,
          password: secondUser.password,
        });

        const joinResult = await api.groups.joinGroup({
          code: userGroup.inviteCode!,
        });

        expect(joinResult.response).toHaveStatus2xx();

        const deleteResult = await api.groups.deleteGroup(userGroup.id!);

        expect(deleteResult.response).toHaveStatus(403);
      },
    );

    test(
      '[GRP-025] Delete group by non-existing ID',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const nonExistingId = utils.random.uuid();

        const deleteResult = await api.groups.deleteGroup(nonExistingId);

        expect(deleteResult.response).toHaveStatus(404);
      },
    );

    test(
      '[GRP-026] Delete group without authorization',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        api.groups.clearTokens();

        const deleteResult = await api.groups.deleteGroup(userGroup.id!);

        expect(deleteResult.response).toHaveStatus(401);
      },
    );

    test(
      "[GRP-058] Deleted group disappears from member's list",
      {
        tag: '@smoke',
      },
      async ({ api, spawnUser, spawnApi }) => {
        const member = await spawnUser();
        const memberApi = await spawnApi();
        await memberApi.auth.login({ identifier: member.email, password: member.password });
        await memberApi.groups.joinGroup({ code: userGroup.inviteCode! });

        await api.groups.deleteGroup(userGroup.id!);

        const memberGroups = await memberApi.groups.getAllGroups();
        expect(memberGroups.data).toHaveLength(0);
      },
    );

    test(
      '[GRP-059] Join deleted group',
      {
        tag: '@sanity',
      },
      async ({ api, spawnUser, spawnApi }) => {
        await api.groups.deleteGroup(userGroup.id!);

        const member = await spawnUser();
        const memberApi = await spawnApi();
        await memberApi.auth.login({ identifier: member.email, password: member.password });

        const joinResult = await memberApi.groups.joinGroup({ code: userGroup.inviteCode! });

        expect(joinResult.response).toHaveStatus4xx();
      },
    );
  },
);
