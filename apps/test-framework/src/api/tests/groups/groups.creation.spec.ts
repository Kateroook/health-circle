import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/creation tests', async () => {
  let user: any;

  test.beforeEach('Authenticate user', async ({ api, spawnUser }) => {
    user = await spawnUser();

    const loginResult = await api.auth.login({
      identifier: user.email,
      password: user.password,
    });
  });

  test('[GROUPS-001] Valid groups creation', async ({ api, groupRepository }) => {
    const validGoupName = utils.random.groupName();

    const createGroupResult = await api.groups.createGroup({
      name: validGoupName,
    });

    expect(createGroupResult.response).toHaveStatus(201);
    expect(createGroupResult.data.members.length).toBe(1);

    const dbData = await groupRepository.getById(createGroupResult.data.id);

    expect(dbData).not.toBeNull();
    expect(dbData!.name).toBe(validGoupName);
    expect(dbData!.ownerId).toBe(user.id);
    expect(dbData!.inviteCode).not.toBeNull();
  });

  test('[GROUPS-002] Group name less then 3', async ({ api, groupRepository }) => {
    const validGroupName = 'AB';

    const createGroupResult = await api.groups.createGroup({
      name: validGroupName,
    });

    expect(createGroupResult.response).toHaveStatus(400);
    expect(createGroupResult.data).toBeNull();
  });

  test('[GROUPS-003] Group name more then 100', async ({ api }) => {
    const invalidGroupName = utils.random.shortId(101);

    const createGroupResult = await api.groups.createGroup({
      name: invalidGroupName,
    });

    expect(createGroupResult.response).toHaveStatus(400);
    expect(createGroupResult.data).toBeNull();
  });

  test('[GROUPS-004] Group with empty name', async ({ api }) => {
    const emptyGroupName = '';

    const createGroupResult = await api.groups.createGroup({
      name: emptyGroupName,
    });

    expect(createGroupResult.response).toHaveStatus(400);
    expect(createGroupResult.data).toBeNull();
  });

  test.fixme('[GROUPS-004-BUG] Group name with whitespaces', async ({ api }) => {
    const whitespacesGroupName = '        ';

    const createGroupResult = await api.groups.createGroup({
      name: whitespacesGroupName,
    });

    expect(createGroupResult.response).toHaveStatus(400);
    expect(createGroupResult.data).toBeNull();
  });

  test('[GROUPS-005] Group without name', async ({ api }) => {
    await test.step('Name as null', async () => {
      const createGroupResult = await api.groups.createGroup({
        name: null as any,
      });

      expect(createGroupResult.response).toHaveStatus(400);
      expect(createGroupResult.data).toBeNull();
    });

    await test.step('Without name', async () => {
      const createGroupResult = await api.groups.createGroup({} as any);

      expect(createGroupResult.response).toHaveStatus(400);
      expect(createGroupResult.data).toBeNull();
    });
  });

  test('[GROUPS-006] Response has invite code', async ({ api }) => {
    const validGroupName = utils.random.groupName();
    const createGroupResult = await api.groups.createGroup({
      name: validGroupName,
    });

    expect(createGroupResult.response).toHaveStatus2xx();
    expect(createGroupResult.data).not.toBeNull();
    expect(createGroupResult.data.inviteCode).not.toBeNull();
  });

  test('[GROUPS-007] Request without authorization', async ({ api }) => {
    const cleanApi = api.clone();

    const validGroupName = utils.random.groupName();
    const createGroupResult = await cleanApi.groups.createGroup({
      name: validGroupName,
    });

    expect(createGroupResult.response).toHaveStatus(401);
    expect(createGroupResult.data).toBeNull();
  });
});
