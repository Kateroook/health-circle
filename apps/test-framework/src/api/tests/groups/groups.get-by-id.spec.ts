import crypto from 'crypto';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/get-by-id tests', async () => {
  let user: UserEntity;

  test.beforeEach('Authenticate user', async ({ api, spawnUser }) => {
    user = await spawnUser();

    const loginResult = await api.auth.login({
      identifier: user.email,
      password: user.password,
    });
  });

  test('[GRP-011] Get existing group by ID', async ({ api, groupRepository }) => {
    const validGroupName = utils.random.groupName();
    const createGroupResult = await api.groups.createGroup({
      name: validGroupName,
    });

    const groupId = createGroupResult.data.id;
    const group = await api.groups.getGroup(groupId);

    expect(group.response).toHaveStatus(200);
    expect(group.data.members).toHaveLength(1);
    expect(group.data.owner.id).toBe(user.id);
  });

  test('[GRP-012] Get group by non-existing Id', async ({ api, spawnUser }) => {
    const nonExistingId = crypto.randomUUID();
    const group = await api.groups.getGroup(nonExistingId);

    expect(group.response).toHaveStatus(404);
    expect(group.data).toBeNull();
  });

  test('[GRP-013] Request without authorization', async ({ api }) => {
    const validGroupName = utils.random.groupName();
    const createGroupResult = await api.groups.createGroup({
      name: validGroupName,
    });

    const groupId = createGroupResult.data.id;

    api.groups.clearTokens();

    const group = await api.groups.getGroup(groupId);

    expect(group.response).toHaveStatus(401);
    expect(group.data).toBeNull();
  });
});
