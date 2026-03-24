import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/blocked-users tests', async () => {
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

    await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });
  });

  test('[GRP-055] Successful get blocked users list', async ({ api }) => {
    await api.groups.blockUser(userGroup.id!, member.id!);

    const blockedListResult = await api.groups.getBlockedUsers(userGroup.id!);
    expect(blockedListResult.response).toHaveStatus(200);
    const blockedUsers = blockedListResult.data as unknown as any[];
    const isUserBlocked = blockedUsers.some((blockRecord) => blockRecord.userId === member.id!);
    expect(isUserBlocked).toBeTruthy();
  });

  test('[GRP-056] Get blocked users list when empty', async ({ api }) => {
    const blockedListResult = await api.groups.getBlockedUsers(userGroup.id!);
    const blockedUsers = blockedListResult.data as unknown as any[];
    expect(blockedListResult.response).toHaveStatus(200);
    expect(blockedUsers).toHaveLength(0);
  });

  test('[GRP-057] Get blocked users list without authorization', async ({ api }) => {
    api.groups.clearTokens();
    const blockedListResult = await api.groups.getBlockedUsers(userGroup.id!);

    expect(blockedListResult.response).toHaveStatus(401);
  });
});
