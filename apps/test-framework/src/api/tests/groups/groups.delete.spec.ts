import { ApiResult } from '../../../core/api/clients/base-client';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { CreateGroupResponse } from '../../../core/types/api';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/delete tests', async () => {
  let groupOwner: UserEntity;
  let initialGroupResult: ApiResult<CreateGroupResponse>;

  test.beforeEach('Setup user and group', async ({ api, spawnUser }) => {
    groupOwner = await spawnUser();

    await api.auth.login({
      identifier: groupOwner.email,
      password: groupOwner.password,
    });

    const userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
    initialGroupResult = await api.groups.createGroup(userGroup);
  });

  test('[GRP-022] Successful delete group by owner', async ({ api }) => {
    const groupId = initialGroupResult.data.id;
    const deleteResult = await api.groups.deleteGroup(groupId);

    expect(deleteResult.response).toHaveStatus(200);
  });

  test('[GRP-023] Deleted group disappears from GET /api/groups', async ({ api, groupRepository }) => {
    const groupId = initialGroupResult.data.id;

    let allGroupsResult = await api.groups.getAllGroups();
    expect(allGroupsResult.data).toHaveLength(1);

    const deleteResult = await api.groups.deleteGroup(groupId);

    allGroupsResult = await api.groups.getAllGroups();
    expect(allGroupsResult.data).toHaveLength(0);
  });

  test('[GRP-024] Non-owner tries to delete group', async ({ api, spawnUser }) => {
    const secondUser = await spawnUser();
    const loginResult = await api.auth.login({
      identifier: secondUser.email,
      password: secondUser.password,
    });

    const joinResult = await api.groups.joinGroup({
      code: initialGroupResult.data.inviteCode,
    });

    expect(joinResult.response).toHaveStatus2xx();

    const groupId = initialGroupResult.data.id;

    const deleteResult = await api.groups.deleteGroup(groupId);

    expect(deleteResult.response).toHaveStatus(403);
  });

  test('[GRP-025] Delete group by non-existing ID', async ({ api }) => {
    const nonExistingId = crypto.randomUUID();

    const deleteResult = await api.groups.deleteGroup(nonExistingId);

    expect(deleteResult.response).toHaveStatus(404);
  });

  test('[GRP-026] Request without authorization', async ({ api }) => {
    api.groups.clearTokens();

    const groupId = initialGroupResult.data.id;
    const deleteResult = await api.groups.deleteGroup(groupId);

    expect(deleteResult.response).toHaveStatus(401);
  });
});
