import { GroupFactory } from '../../../core/data/factories/group-factory';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/groups/get-all tests',
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
      "[GRP-008] Successful get list of user's groups",
      {
        tag: '@smoke',
      },
      async ({ api, groupRepository }) => {
        const userGroups = await api.groups.getAllGroups();

        expect(userGroups.response).toHaveStatus(200);
        expect(userGroups).not.toBeNull();
        expect(userGroups.data.length).toBe(0);

        const groupDbRow = await groupRepository.findBy({ ownerId: user.id });
        expect(groupDbRow.length).toBe(0);
      },
    );

    test(
      "[GRP-009] Get list of user's groups contains newly created group",
      {
        tag: '@smoke',
      },
      async ({ api, groupRepository }) => {
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

        const groupDbRow = await groupRepository.findBy({ ownerId: user.id });
        expect(groupDbRow).toHaveLength(1);
        expect(groupDbRow[0].id).toBe(createdGroupId);
      },
    );

    test(
      "[GRP-010] Get list of user's groups without authorization",
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        api.groups.clearTokens();
        const result = await api.groups.getAllGroups();

        expect(result.response).toHaveStatus(401);
        expect(result.data).toBeNull();
      },
    );
  },
);
