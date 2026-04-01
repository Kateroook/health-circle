import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/groups/flow tests',
  {
    tag: '@groups',
  },
  async () => {
    let userA: UserEntity;
    let userB: UserEntity;
    let secondApi: ApiClientFactory;

    test.beforeEach('Authenticate user', async ({ api, spawnUser, spawnApi }) => {
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

    test('[GRP-E2E-001] Full group life cycle', async ({ api }) => {
      const userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
      const createGroupResult = await api.groups.createGroup(userGroup);
      userGroup.id = createGroupResult.data.id;
      userGroup.inviteCode = createGroupResult.data.inviteCode;

      expect(createGroupResult.response).toHaveStatus2xx();
      expect(userGroup.inviteCode).toBeDefined();

      const joinResult = await secondApi.groups.joinGroup({ code: userGroup.inviteCode });

      expect(joinResult.response).toHaveStatus2xx();
      const updateGroup = await api.groups.getGroup(userGroup.id);
      const isInGroup = updateGroup.data.members.some((user) => user.id === userB.id);
      expect(isInGroup).toBeTruthy();

      const deleteResult = await api.groups.deleteGroup(userGroup.id);

      expect(deleteResult.response).toHaveStatus2xx();
    });

    test('[GRP-E2E-002] Block and unblock flow', async ({ api }) => {
      const userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
      const createGroupResult = await api.groups.createGroup(userGroup);
      userGroup.id = createGroupResult.data.id;
      userGroup.inviteCode = createGroupResult.data.inviteCode;

      await secondApi.groups.joinGroup({ code: userGroup.inviteCode });

      const blockResult = await api.groups.blockUser(userGroup.id, userB.id!);
      expect(blockResult.response).toHaveStatus2xx();

      let joinResult = await secondApi.groups.joinGroup({ code: userGroup.inviteCode });
      expect(joinResult.response).toHaveStatus(403);

      const unblockResult = await api.groups.unblockUser(userGroup.id, userB.id!);
      expect(unblockResult.response).toHaveStatus2xx();

      joinResult = await secondApi.groups.joinGroup({ code: userGroup.inviteCode });
      expect(joinResult.response).toHaveStatus(201);
    });

    test('[GRP-E2E-003] Leave and verify in both users', async ({ api }) => {
      const userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
      const createGroupResult = await api.groups.createGroup(userGroup);
      userGroup.id = createGroupResult.data.id;
      userGroup.inviteCode = createGroupResult.data.inviteCode;

      await secondApi.groups.joinGroup({ code: userGroup.inviteCode });
      const leaveResult = await secondApi.groups.leaveGroup(userGroup.id);
      expect(leaveResult.response).toHaveStatus2xx();

      const groupData = await api.groups.getGroup(userGroup.id);
      const isInGroup = groupData.data.members.some((user) => user.id === userB.id);
      expect(isInGroup).toBeFalsy();

      const memberGroups = await secondApi.groups.getAllGroups();
      const isGroupPresent = memberGroups.data.some((g) => g.id === userGroup.id);
      expect(isGroupPresent).toBeFalsy();
    });
  },
);
