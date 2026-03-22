import { GroupFactory } from '../../../core/data/factories/group-factory';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/get-all tests', async () => {
  let user: UserEntity;

  test.beforeEach('Authenticate user', async ({ api, spawnUser }) => {
    user = await spawnUser();

    const loginResult = await api.auth.login({
      identifier: user.email,
      password: user.password,
    });
  });

  test("[GRP-008] Get list of user's groups", async ({ api, groupRepository }) => {
    const userGroups = await api.groups.getAllGroups();

    expect(userGroups.response).toHaveStatus(200);
    expect(userGroups).not.toBeNull();
    expect(userGroups.data.length).toBe(0);

    const dbData = await groupRepository.findBy({ ownerId: user.id });
    expect(dbData.length).toBe(0);
  });

  test("[GRP-009] User's list contains newly created group", async ({ api, groupRepository }) => {
    const userOldGroups = await api.groups.getAllGroups();
    expect(userOldGroups.response).toHaveStatus(200);
    expect(userOldGroups.data).toHaveLength(0);

    const userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());

    const createGroupResult = await api.groups.createGroup(userGroup);
    const createdGroupId = createGroupResult.data.id;

    const userNewGroups = await api.groups.getAllGroups();
    expect(userNewGroups.response).toHaveStatus(200);
    expect(userNewGroups.data).toHaveLength(1);

    const returnedGroup = userNewGroups.data[0];
    expect(returnedGroup.id).toBe(createdGroupId);
    expect(returnedGroup.name).toBe(userGroup.name);

    const dbData = await groupRepository.findBy({ ownerId: user.id });
    expect(dbData).toHaveLength(1);
    expect(dbData[0].id).toBe(createdGroupId);
  });

  test('[GRP-010] Request without authorization', async ({ api }) => {
    api.groups.clearTokens();
    const result = await api.groups.getAllGroups();

    expect(result.response).toHaveStatus(401);
    expect(result.data).toBeNull();
  });
});
