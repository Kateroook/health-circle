import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/groups/block-user tests',
  {
    tag: '@groups',
  },
  async () => {
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

    test('[GRP-045] Successful user block by owner', async ({ api }) => {
      const blockResult = await api.groups.blockUser(userGroup.id!, member.id!);
      expect(blockResult.response).toHaveStatus(201); // must be 200
    });

    test('[GRP-046] Blocked user is absent in group members list', async ({ api }) => {
      await api.groups.blockUser(userGroup.id!, member.id!);
      const group = await api.groups.getGroup(userGroup.id!);
      expect(group.data.members[1]).toBeUndefined();
    });

    test('[GRP-047] Join group by blocked user', async ({ api }) => {
      await api.groups.blockUser(userGroup.id!, member.id!);
      const joinResult = await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });
      expect(joinResult.response).toHaveStatus(403);
    });

    test('[GRP-048] Block user by non-owner member', async ({ spawnUser, spawnApi }) => {
      const secondMember = await spawnUser();
      const secondMemberApi = await spawnApi();
      await secondMemberApi.auth.login({
        identifier: member.email,
        password: member.password,
      });
      await secondMemberApi.groups.joinGroup({ code: userGroup.inviteCode! });
      const blockResult = await secondApi.groups.blockUser(userGroup.id!, secondMember.id!);
      expect(blockResult.response).toHaveStatus(401);
    });

    test.fixme('[GRP-049-BUG] Block member by non-existing user ID', async ({ api }) => {
      const nonExistingId = utils.random.uuid();
      const blockResult = await api.groups.blockUser(userGroup.id!, nonExistingId);
      expect(blockResult.response).toHaveStatus(404);
    });

    test('[GRP-050] Block user without authorization', async ({ api }) => {
      api.groups.clearTokens();
      const blockResult = await api.groups.blockUser(userGroup.id!, member.id!);
      expect(blockResult.response).toHaveStatus(401);
    });
  },
);
