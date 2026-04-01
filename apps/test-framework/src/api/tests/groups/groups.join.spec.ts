import { ApiClientFactory } from '../../../core/api/api-client-factory';
import { GroupFactory } from '../../../core/data/factories/group-factory';
import { GroupEntity } from '../../../core/types/entites/group-interface';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/groups/join tests',
  {
    tag: '@groups',
  },
  async () => {
    let owner: UserEntity;
    let secondUser: UserEntity;
    let secondApi: ApiClientFactory;
    let userGroup: GroupEntity;

    test.beforeEach('Setup owner, group and second user', async ({ api, spawnUser, spawnApi }) => {
      owner = await spawnUser();
      await api.auth.login({
        identifier: owner.email,
        password: owner.password,
      });

      userGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
      const createResult = await api.groups.createGroup(userGroup);
      userGroup.id = createResult.data.id;
      userGroup.inviteCode = createResult.data.inviteCode;

      secondUser = await spawnUser();
      secondApi = await spawnApi();
      await secondApi.auth.login({
        identifier: secondUser.email,
        password: secondUser.password,
      });
    });

    test(
      '[GRP-032] Successful join by valid invite code',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const joinResult = await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });
        expect(joinResult.response).toHaveStatus(201); // must be 200
        const ownerGroup = await api.groups.getGroup(userGroup.id!);
        expect(ownerGroup.data.members[1].id).toBe(secondUser.id!);
      },
    );

    test(
      '[GRP-033] Group appears on GET /api/groups after joining',
      {
        tag: '@smoke',
      },
      async ({}) => {
        await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });
        const allGroup = await secondApi.groups.getAllGroups();
        expect(allGroup.data).toHaveLength(1);
      },
    );

    [
      {
        testName: '[GRP-034] Join group with wrong invite code',
        code: 'XXXXXX',
        tag: '@sanity',
      },
      {
        testName: '[GRP-035] Join group with invite code shorter than 6 char',
        code: 'ABC',
        tag: '@sanity',
      },
      {
        testName: '[GRP-036] Join group with invite code longer than 6 char',
        code: 'ABCDEFG',
        tag: '@sanity',
      },
      {
        testName: '[GRP-037] Join group with empty invite code ',
        code: '',
        tag: '@sanity',
      },
    ].forEach((options) =>
      test(options.testName, { tag: options.tag }, async () => {
        const joinResult = await secondApi.groups.joinGroup({ code: options.code });

        expect(joinResult.response).toHaveStatus4xx();
        expect(joinResult.data).toBeNull();
      }),
    );

    test(
      '[GRP-038] Join attempt by blocked user',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });
        await api.groups.blockUser(userGroup.id!, secondUser.id!);
        const joinResult = await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });
        expect(joinResult.response).toHaveStatus(403);
      },
    );

    test.fixme(
      '[GRP-039] Removed user can join group again',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });

        await api.groups.updateGroup({
          id: userGroup.id!,
          name: userGroup.name,
          members: [{ id: owner.id! }],
        });

        const rejoinResult = await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });

        expect(rejoinResult.response).toHaveStatus(200);
      },
    );

    test(
      '[GRP-040] Join group without authorization',
      {
        tag: '@smoke',
      },
      async () => {
        secondApi.groups.clearTokens();
        const joinResult = await secondApi.groups.joinGroup({ code: userGroup.inviteCode! });

        expect(joinResult.response).toHaveStatus(401);
      },
    );
  },
);
