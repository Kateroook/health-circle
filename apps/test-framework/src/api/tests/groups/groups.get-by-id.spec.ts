import crypto from 'crypto';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/get-by-id tests', async () => {
  test('[GRP-011] Get existing group by ID', async ({ api, spawnUser, groupRepository }) => {
    const user = await spawnUser();
    await api.auth.login({
      identifier: user.email,
      password: user.password,
    });

    const validGroupName = utils.random.groupName();
    const createGroupResult = await api.groups.createGroup({
      name: validGroupName,
    });

    const groupId = createGroupResult.data.id;
    const group = await api.groups.getGroup(groupId);

    expect(group.response).toHaveStatus(200);
    expect(group.data.members).toHaveLength(1);
    expect(group.data.owner.id).toBe(user.id);
    expect(group.data.inviteCode).not.toBeNull();

    const dbData = await groupRepository.getById(groupId);
    expect(dbData).not.toBeNull();
    expect(dbData!.ownerId).toBe(user.id);
    expect(dbData!.inviteCode).not.toBeNull();
  });

  test('[GRP-012] Get group by non-existing Id', async ({ api, spawnUser }) => {
    const user = await spawnUser();
    await api.auth.login({
      identifier: user.email,
      password: user.password,
    });

    const nonExistId = crypto.randomUUID();
    const group = await api.groups.getGroup(nonExistId);

    expect(group.response).toHaveStatus(404);
    expect(group.data).toBeNull();
  });

  test('[GRP-013] Request without authorization', async ({ api }) => {
    const nonExistId = crypto.randomUUID();
    const group = await api.groups.getGroup(nonExistId);

    expect(group.response).toHaveStatus(401);
    expect(group.data).toBeNull();
  });
});
