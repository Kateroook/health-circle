import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'DELETE /api/users tests',
  {
    tag: '@users',
  },
  async () => {
    test(
      '[USR-050] Deleting a member removes them from circle members',
      {
        tag: '@smoke',
      },
      async ({ spawnApi, spawnUser }) => {
        const owner = await spawnUser();
        const member = await spawnUser();

        const ownerApi = await spawnApi();
        const memberApi = await spawnApi();

        expect(
          (await ownerApi.auth.login({ identifier: owner.email, password: owner.password })).response,
        ).toHaveStatus2xx();
        expect(
          (await memberApi.auth.login({ identifier: member.email, password: member.password })).response,
        ).toHaveStatus2xx();

        const createdGroup = await ownerApi.groups.createGroup({ name: 'Delete member cleanup' });
        expect(createdGroup.response).toHaveStatus2xx();

        const joinedGroup = await memberApi.groups.joinGroup({ code: createdGroup.data.inviteCode });
        expect(joinedGroup.response).toHaveStatus2xx();

        const deleteUser = await memberApi.users.deleteUser();
        expect(deleteUser.response).toHaveStatus2xx();

        const groupAfterDelete = await ownerApi.groups.getGroup(createdGroup.data.id);
        expect(groupAfterDelete.response).toHaveStatus2xx();
        expect(groupAfterDelete.data.members.map((item) => item.id)).not.toContain(member.id);
      },
    );

    test(
      '[USR-051] Deleting an owner removes owned circles for remaining members',
      {
        tag: '@smoke',
      },
      async ({ spawnApi, spawnUser }) => {
        const owner = await spawnUser();
        const member = await spawnUser();

        const ownerApi = await spawnApi();
        const memberApi = await spawnApi();

        expect(
          (await ownerApi.auth.login({ identifier: owner.email, password: owner.password })).response,
        ).toHaveStatus2xx();
        expect(
          (await memberApi.auth.login({ identifier: member.email, password: member.password })).response,
        ).toHaveStatus2xx();

        const createdGroup = await ownerApi.groups.createGroup({ name: 'Delete owner cleanup' });
        expect(createdGroup.response).toHaveStatus2xx();

        const joinedGroup = await memberApi.groups.joinGroup({ code: createdGroup.data.inviteCode });
        expect(joinedGroup.response).toHaveStatus2xx();

        const deleteUser = await ownerApi.users.deleteUser();
        expect(deleteUser.response).toHaveStatus2xx();

        const groupsAfterDelete = await memberApi.groups.getAllGroups();
        expect(groupsAfterDelete.response).toHaveStatus2xx();
        expect(groupsAfterDelete.data).toEqual([]);
      },
    );
  },
);
