import { ApiResult } from '../../../core/api/clients/base-client';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { CreateGroupResponse } from '../../../core/types/api';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/groups/update tests', async () => {
  let groupOwner: UserEntity;
  let initialGroupResult: ApiResult<CreateGroupResponse>;

  test.beforeEach('Setup user and group', async ({ api, spawnUser }) => {
    groupOwner = await spawnUser();

    const loginResult = await api.auth.login({
      identifier: groupOwner.email,
      password: groupOwner.password,
    });

    const userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());

    const createGroupResult = await api.groups.createGroup(userGroup);
    initialGroupResult = createGroupResult;
  });

  test('[GRP-014] Successful group rename', async ({ api }) => {
    const groupNewName = utils.random.groupName();
    const groupId = initialGroupResult.data.id;

    const updateResult = await api.groups.updateGroup({
      id: groupId,
      members: [],
      name: groupNewName,
    });

    expect(updateResult.response).toHaveStatus(200);
    expect(updateResult.data.name).toBe(groupNewName);
  });

  test.fixme('[GRP-015] Update member list', async ({ api, spawnUser }) => {
    const secondUser = await spawnUser();
    const groupId = initialGroupResult.data.id;
    const membersList = initialGroupResult.data.members;
    const updateResult = await api.groups.updateGroup({
      id: groupId,
      members: [{ id: groupOwner.id! }, { id: secondUser.id! }],
    });

    expect(updateResult.response).toHaveStatus(200);
    expect(updateResult.data.members.length).not.toBe(membersList.length);
  });

  [
    {
      testName: '[GRP-016] Name shorter than 3 chars',
      payloadOverride: { name: 'AB' },
    },
    {
      testName: '[GRP-017] Name longer than 100 chars',
      payloadOverride: { name: utils.random.shortId(101) },
    },
    {
      testName: '[GRP-018] Missing id field',
      payloadOverride: { id: undefined },
    },
  ].forEach(({ testName, payloadOverride }) => {
    test(testName, async ({ api }) => {
      const groupId = initialGroupResult.data.id;
      const initialGroupName = initialGroupResult.data.name;

      const basePayload = {
        id: groupId,
        name: initialGroupName,
        members: [],
      };

      const finalPayload = { ...basePayload, ...payloadOverride };

      const updateResult = await api.groups.updateGroup(finalPayload as any);

      expect(updateResult.response).toHaveStatus(400);
    });
  });

  test.fixme('[GRP-019] Missing members field', async ({ api }) => {
    const groupId = initialGroupResult.data.id;

    const updateResult = await api.groups.updateGroup({
      id: groupId,
      members: undefined as any,
    });
    expect(updateResult.response).toHaveStatus(400);
  });

  test('[GRP-020] Member try to update group', async ({ api, spawnUser }) => {
    const secondUser = await spawnUser();
    const loginResult = await api.auth.login({
      identifier: secondUser.email,
      password: secondUser.password,
    });

    const joinResult = await api.groups.joinGroup({
      code: initialGroupResult.data.inviteCode,
    });

    expect(joinResult.response).toHaveStatus2xx();

    const groupId = initialGroupResult.data.id;

    const updateResult = await api.groups.updateGroup({
      id: groupId,
      members: [],
      name: 'New name',
    });

    expect(updateResult.response).toHaveStatus(403);
    expect(updateResult.data).toBeNull();
  });

  test('[GRP-021] Request without authorization', async ({ api }) => {
    await api.groups.clearTokens();

    const groupId = initialGroupResult.data.id;
    const updateResult = await api.groups.updateGroup({
      id: groupId,
      members: [],
      name: 'New name',
    });

    expect(updateResult.response).toHaveStatus(401);
    expect(updateResult.data).toBeNull();
  });
});
