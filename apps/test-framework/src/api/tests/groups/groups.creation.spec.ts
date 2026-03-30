import { GroupFactory } from '../../../core/data/factories/group-factory';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/creation tests', async () => {
  let user: UserEntity;

  test.beforeEach('Authenticate user', async ({ api, spawnUser }) => {
    user = await spawnUser();

    await api.auth.login({
      identifier: user.email,
      password: user.password,
    });
  });

  test('[GRP-001] Successful group creation', async ({ api, groupRepository }) => {
    const validGroup = GroupFactory.createEmptyGroup(utils.random.groupName());

    const createGroupResult = await api.groups.createGroup(validGroup);

    expect(createGroupResult.response).toHaveStatus(201);
    expect(createGroupResult.data.members.length).toBe(1);

    const groupDbRow = await groupRepository.getById(createGroupResult.data.id);

    expect(groupDbRow).not.toBeNull();
    expect(groupDbRow!.name).toBe(validGroup.name);
    expect(groupDbRow!.ownerId).toBe(user.id);
    expect(groupDbRow!.inviteCode).not.toBeNull();
    expect(groupDbRow!).toBeDefined();
  });

  test.fixme('[GRP-004-BUG] Group creation with whitespaces only in name', async ({ api }) => {
    const whitespacesNameGroup = GroupFactory.createEmptyGroup('        ');

    const createGroupResult = await api.groups.createGroup(whitespacesNameGroup);

    expect(createGroupResult.response).toHaveStatus(400);
    expect(createGroupResult.data).toBeNull();
  });

  [
    {
      testName: '[GRP-002] Group creation with name shorter than 3 chars',
      groupName: 'AB',
    },
    {
      testName: '[GRP-003] Group creation with name longer than 100 chars',
      groupName: utils.random.shortId(101),
    },
    {
      testName: '[GRP-004] Group creation with empty name',
      groupName: '',
    },
    {
      testName: '[GRP-005] Group creation without name field',
      groupName: undefined as any,
    },
  ].forEach((options) =>
    test(options.testName, async ({ api }) => {
      const createGroupResult = await api.groups.createGroup({
        name: options.groupName,
      });

      expect(createGroupResult.response).toHaveStatus(400);
      expect(createGroupResult.data).toBeNull();
    }),
  );

  test('[GRP-006] Successful group creation returns invite code', async ({ api }) => {
    const validGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
    const createGroupResult = await api.groups.createGroup(validGroup);

    expect(createGroupResult.response).toHaveStatus2xx();
    expect(createGroupResult.data).not.toBeNull();
    expect(createGroupResult.data.inviteCode).not.toBeNull();
  });

  test('[GRP-007] Group creation without authorization', async ({ api }) => {
    api.groups.clearTokens();

    const validGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
    const createGroupResult = await api.groups.createGroup(validGroup);

    expect(createGroupResult.response).toHaveStatus(401);
    expect(createGroupResult.data).toBeNull();
  });
});
