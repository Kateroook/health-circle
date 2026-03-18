import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/get-all tests', async () => {
  test("[GRP-008] Get list of user's groups", async ({ api, spawnUser, groupRepository }) => {
    const user = await spawnUser();
    const loginResult = await api.auth.login({
      identifier: user.email,
      password: user.password,
    });
    const userGroups = await api.groups.getAllGroups();

    expect(userGroups.response).toHaveStatus(200);
    expect(userGroups).not.toBeNull();
    expect(userGroups.data.length).toBe(0);

    const dbData = await groupRepository.findBy({ ownerId: user.id });
    expect(dbData.length).toBe(0);
  });

  test("[GRP-009] User's list contains newly created group", async ({ api, spawnUser, groupRepository }) => {
    const user = await spawnUser();
    await api.auth.login({
      identifier: user.email,
      password: user.password,
    });

    const userOldGroups = await api.groups.getAllGroups();
    expect(userOldGroups.response).toHaveStatus(200);
    expect(userOldGroups.data).toHaveLength(0);

    const validGroupName = utils.random.groupName();
    const createGroupResult = await api.groups.createGroup({
      name: validGroupName,
    });
    const createdGroupId = createGroupResult.data.id;

    const userNewGroups = await api.groups.getAllGroups();
    expect(userNewGroups.response).toHaveStatus(200);
    expect(userNewGroups.data).toHaveLength(1);

    const returnedGroup = userNewGroups.data[0];
    expect(returnedGroup.id).toBe(createdGroupId);
    expect(returnedGroup.name).toBe(validGroupName);

    const dbData = await groupRepository.findBy({ ownerId: user.id });
    expect(dbData).toHaveLength(1);
    expect(dbData[0].id).toBe(createdGroupId);
  });

  test('[GRP-010] Request without authorization', async ({ api }) => {
    const result = await api.groups.getAllGroups();

    expect(result.response).toHaveStatus(401);
    expect(result.data).toBeNull();
  });
});
