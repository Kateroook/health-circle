import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/leave tests', async () => {
  let owner: UserEntity;
  let member: UserEntity;
  let secondApi: ApiClientFactory;
  let userGroup: GroupEntity;

  test.beforeEach('Setup owner, group and member', async ({ api, spawnUser, spawnApi }) => {
    owner = await spawnUser();
    await api.auth.login({
      identifier: owner.email,
      password: owner.password,
    });

    userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
    const createResult = await api.groups.createGroup(userGroup);
    userGroup.id = createResult.data.id;
    userGroup.inviteCode = createResult.data.inviteCode;

    member = await spawnUser();
    secondApi = await spawnApi();
    await secondApi.auth.login({
      identifier: member.email,
      password: member.password,
    });
    await secondApi.groups.joinGroup({ code: userGroup.inviteCode });
  });

  test('[GRP-027] Successful leave from group by member', async ({ api }) => {
    const leaveResult = await secondApi.groups.leaveGroup(userGroup.id!);

    expect(leaveResult.response).toHaveStatus(201); //must be 200
    const group = await api.groups.getGroup(userGroup.id!);
    expect(group.data.members).toHaveLength(1);
  });

  test('[GRP-028] Group disappears from GET /api/groups after leaving', async () => {
    await secondApi.groups.leaveGroup(userGroup.id!);
    const allGroup = await secondApi.groups.getAllGroups();
    expect(allGroup.data).toHaveLength(0);
  });

  test.fixme('[GRP-029-BUG] Leave group by non-member', async ({ spawnUser, spawnApi }) => {
    const outsider = await spawnUser();
    const thirdApi = await spawnApi();

    await thirdApi.auth.login({
      identifier: outsider.email,
      password: outsider.password,
    });

    const leaveResult = await thirdApi.groups.leaveGroup(userGroup.id!);

    expect(leaveResult.response).toHaveStatus4xx();
  });

  test('[GRP-030] Owner tries to leave their own group', async ({ api }) => {
    const leaveResult = await api.groups.leaveGroup(userGroup.id!);
    expect(leaveResult.response).toHaveStatus(403);
  });

  test('[GRP-031] Leave group without authorization', async () => {
    secondApi.groups.clearTokens();
    const leaveResult = await secondApi.groups.leaveGroup(userGroup.id!);

    expect(leaveResult.response).toHaveStatus(401);
  });
});
