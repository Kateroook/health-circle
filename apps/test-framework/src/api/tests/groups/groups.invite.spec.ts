import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/groups/invite tests',
  {
    tag: '@groups',
  },
  async () => {
    let owner: UserEntity;
    let userGroup: GroupEntity;

    test.beforeEach('Setup owner and group', async ({ api, spawnUser }) => {
      owner = await spawnUser();
      await api.auth.login({
        identifier: owner.email,
        password: owner.password,
      });

      userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
      const createResult = await api.groups.createGroup(userGroup);
      userGroup.id = createResult.data.id;
      userGroup.inviteCode = createResult.data.inviteCode;
    });

    test(
      '[GRP-041] Successful invite code regeneration by owner',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const oldCode = userGroup.inviteCode;
        const regenCodeResult = await api.groups.regenerateInviteCode(userGroup.id!);
        expect(regenCodeResult.response).toHaveStatus(201);
        expect(regenCodeResult.data.inviteCode).not.toBe(oldCode);
      },
    );

    test(
      '[GRP-042] Join group with outdated invite code',
      {
        tag: '@smoke',
      },
      async ({ api, spawnApi, spawnUser }) => {
        const secondUser = await spawnUser();
        const secondApi = await spawnApi();
        await secondApi.auth.login({
          identifier: secondUser.email,
          password: secondUser.password,
        });

        const oldCode = userGroup.inviteCode;
        await api.groups.regenerateInviteCode(userGroup.id!);
        const joinResult = await secondApi.groups.joinGroup({ code: oldCode! });
        expect(joinResult.response).toHaveStatus(404);
      },
    );

    test(
      '[GRP-043] Invite code regeneration by non-owner member',
      {
        tag: '@sanity',
      },
      async ({ spawnApi, spawnUser }) => {
        const secondUser = await spawnUser();
        const secondApi = await spawnApi();
        await secondApi.auth.login({
          identifier: secondUser.email,
          password: secondUser.password,
        });

        await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });
        const regenCodeResult = await secondApi.groups.regenerateInviteCode(userGroup.id!);
        expect(regenCodeResult.response).toHaveStatus(403);
      },
    );

    test(
      '[GRP-044] Invite code regeneration without authorization',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        api.groups.clearTokens();
        const regenCodeResult = await api.groups.regenerateInviteCode(userGroup.id!);

        expect(regenCodeResult.response).toHaveStatus(401);
      },
    );
  },
);
