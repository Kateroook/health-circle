import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/update tests', async () => {
  let groupOwner: UserEntity;
  let userGroup: GroupEntity;

  test.beforeEach('Setup user and group', async ({ api, spawnUser }) => {
    groupOwner = await spawnUser();

    const loginResult = await api.auth.login({
      identifier: groupOwner.email,
      password: groupOwner.password,
    });

    userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
    const createGroupResult = await api.groups.createGroup(userGroup);
    userGroup.id = createGroupResult.data.id;
    userGroup.inviteCode = createGroupResult.data.inviteCode;
  });

  test('[GRP-014] Successful group rename by owner', async ({ api }) => {
    const groupNewName = utils.random.groupName();

    const updateResult = await api.groups.updateGroup({
      id: userGroup.id!,
      members: [],
      name: groupNewName,
    });

    expect(updateResult.response).toHaveStatus(200);
    expect(updateResult.data.name).toBe(groupNewName);
  });

  test.fixme('[GRP-015-BUG] Successful member list update by owner', async ({ api, spawnUser }) => {
    const secondUser = await spawnUser();
    const updateResult = await api.groups.updateGroup({
      id: userGroup.id!,
      members: [{ id: groupOwner.id! }, { id: secondUser.id! }],
    });

    expect(updateResult.response).toHaveStatus(200);
    expect(updateResult.data.members.length).not.toBe(userGroup.members.length);
  });

  [
    {
      testName: '[GRP-016] Update group with name shorter than 3 chars',
      payloadOverride: { name: 'AB' },
    },
    {
      testName: '[GRP-017] Update group with name longer than 100 chars',
      payloadOverride: { name: utils.random.shortId(101) },
    },
    {
      testName: '[GRP-018] Update group without ID field',
      payloadOverride: { id: undefined },
    },
  ].forEach(({ testName, payloadOverride }) => {
    test(testName, async ({ api }) => {
      const basePayload = {
        id: userGroup.id!,
        name: userGroup.name,
        members: [],
      };

      const finalPayload = { ...basePayload, ...payloadOverride };

      const updateResult = await api.groups.updateGroup(finalPayload as any);

      expect(updateResult.response).toHaveStatus(400);
    });
  });

  test.fixme('[GRP-019-BUG] Update group without members field', async ({ api }) => {
    const updateResult = await api.groups.updateGroup({
      id: userGroup.id!,
      members: undefined as any,
    });
    expect(updateResult.response).toHaveStatus(400);
  });

  test('[GRP-020] Update group by non-owner member', async ({ api, spawnUser }) => {
    const secondUser = await spawnUser();
    const loginResult = await api.auth.login({
      identifier: secondUser.email,
      password: secondUser.password,
    });

    const joinResult = await api.groups.joinGroup({
      code: userGroup.inviteCode!,
    });

    expect(joinResult.response).toHaveStatus2xx();

    const updateResult = await api.groups.updateGroup({
      id: userGroup.id!,
      members: [],
      name: 'New name',
    });

    expect(updateResult.response).toHaveStatus(403);
    expect(updateResult.data).toBeNull();
  });

  test('[GRP-021] Update group without authorization', async ({ api }) => {
    await api.groups.clearTokens();

    const updateResult = await api.groups.updateGroup({
      id: userGroup.id!,
      members: [],
      name: 'New name',
    });

    expect(updateResult.response).toHaveStatus(401);
    expect(updateResult.data).toBeNull();
  });
});
