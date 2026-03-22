import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { ApiResult } from '../../../core/api/clients/base-client';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { CreateGroupResponse } from '../../../core/types/api';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/leave tests', async () => {
  let owner: UserEntity;
  let member: UserEntity;
  let secondApi: ApiClientFactory;
  let initialGroupResult: ApiResult<CreateGroupResponse>;

  test.beforeEach('Setup owner, group and member', async ({ api, spawnUser, spawnApi }) => {
    owner = await spawnUser();
    await api.auth.login({
      identifier: owner.email,
      password: owner.password,
    });

    const userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
    const createResult = await api.groups.createGroup(userGroup);
    initialGroupResult = createResult;
    const inviteCode = createResult.data.inviteCode;

    member = await spawnUser();
    secondApi = await spawnApi();
    await secondApi.auth.login({
      identifier: member.email,
      password: member.password,
    });
    await secondApi.groups.joinGroup({ code: inviteCode });
  });

  test.afterEach('Clear second api context', async () => {
    secondApi.clearContext();
  });

  test('[GRP-027] Successful leave from group', async ({ api }) => {
    const groupId = initialGroupResult.data.id;
    const leaveResult = await secondApi.groups.leaveGroup(groupId);

    expect(leaveResult.response).toHaveStatus(201); //must be 200
    const group = await api.groups.getGroup(groupId);
    expect(group.data.members).toHaveLength(1);
  });

  test('[GRP-028] Group disappears from GET /api/groups after leaving', async ({ api }) => {
    const groupId = initialGroupResult.data.id;
    const leaveResult = await secondApi.groups.leaveGroup(groupId);
    const allGroup = await secondApi.groups.getAllGroups();
    expect(allGroup.data).toHaveLength(0);
  });

  test.fixme('[GRP-029] Try to leave group without being a member', async ({ spawnUser, spawnApi }) => {
    const outsider = await spawnUser();
    const thirdApi = await spawnApi();
    const groupId = initialGroupResult.data.id;

    await thirdApi.auth.login({
      identifier: outsider.email,
      password: outsider.password,
    });

    const leaveResult = await thirdApi.groups.leaveGroup(groupId);

    expect(leaveResult.response).toHaveStatus4xx();
  });

  test('[GRP-030] Owner tries to leave their own group', async ({ api }) => {
    const groupId = initialGroupResult.data.id;
    const leaveResult = await api.groups.leaveGroup(groupId);
    expect(leaveResult.response).toHaveStatus(403);
  });

  test('[GRP-031] Request without authorization', async ({ api }) => {
    const groupId = initialGroupResult.data.id;

    api.groups.clearTokens();
    const leaveResult = await api.groups.leaveGroup(groupId);

    expect(leaveResult.response).toHaveStatus(401);
  });
});
