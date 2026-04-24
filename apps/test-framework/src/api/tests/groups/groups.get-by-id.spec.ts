import { GroupFactory } from '../../../core/data/factories/group-factory';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/groups/get-by-id tests',
  {
    tag: '@groups',
  },
  async () => {
    let user: UserEntity;

    test.beforeEach('Authenticate user', async ({ api, spawnUser }) => {
      user = await spawnUser();

      await api.auth.login({
        identifier: user.email,
        password: user.password,
      });
    });

    test(
      '[GRP-011] Successful get group by existing ID',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const validGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
        const createGroupResult = await api.groups.createGroup(validGroup);

        const groupId = createGroupResult.data.id;
        const group = await api.groups.getGroup(groupId);

        expect(group.response).toHaveStatus(200);
        expect(group.data.members).toHaveLength(1);
        expect(group.data.owner.id).toBe(user.id);
      },
    );

    test(
      '[GRP-012] Get group by non-existing ID',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const nonExistingId = utils.random.uuid();
        const group = await api.groups.getGroup(nonExistingId);

        expect(group.response).toHaveStatus(404);
        expect(group.data).toBeNull();
      },
    );

    test(
      '[GRP-013] Get group by ID without authorization',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const validGroup = GroupFactory.createEmptyGroup(utils.random.groupName());
        const createGroupResult = await api.groups.createGroup(validGroup);

        const groupId = createGroupResult.data.id;

        api.groups.clearTokens();

        const group = await api.groups.getGroup(groupId);

        expect(group.response).toHaveStatus(401);
        expect(group.data).toBeNull();
      },
    );
  },
);
