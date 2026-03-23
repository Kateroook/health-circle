import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/delete tests', async () => {
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

  test('[GRP-022] Successful delete group by owner', async ({ api }) => {
    const deleteResult = await api.groups.deleteGroup(userGroup.id!);

    expect(deleteResult.response).toHaveStatus(200);
  });

  test('[GRP-023] Deleted group disappears from GET /api/groups', async ({ api, groupRepository }) => {
    let allGroupsResult = await api.groups.getAllGroups();
    expect(allGroupsResult.data).toHaveLength(1);

    const deleteResult = await api.groups.deleteGroup(userGroup.id!);

    allGroupsResult = await api.groups.getAllGroups();
    expect(allGroupsResult.data).toHaveLength(0);
  });

  test('[GRP-024] Delete group by non-owner member', async ({ api, spawnUser }) => {
    const secondUser = await spawnUser();
    const loginResult = await api.auth.login({
      identifier: secondUser.email,
      password: secondUser.password,
    });

    const joinResult = await api.groups.joinGroup({
      code: userGroup.inviteCode!,
    });

    expect(joinResult.response).toHaveStatus2xx();

    const deleteResult = await api.groups.deleteGroup(userGroup.id!);

    expect(deleteResult.response).toHaveStatus(403);
  });

  test('[GRP-025] Delete group by non-existing ID', async ({ api }) => {
    const nonExistingId = crypto.randomUUID();

    const deleteResult = await api.groups.deleteGroup(nonExistingId);

    expect(deleteResult.response).toHaveStatus(404);
  });

  test('[GRP-026] Delete group without authorization', async ({ api }) => {
    api.groups.clearTokens();

    const deleteResult = await api.groups.deleteGroup(userGroup.id!);

    expect(deleteResult.response).toHaveStatus(401);
  });
});
