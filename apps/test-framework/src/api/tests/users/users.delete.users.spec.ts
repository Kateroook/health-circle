import { UserEntity } from '@core/types/entites/user-interface';
import { expect, test } from '../../fixtures/api-fixture';
import { ApiResult } from '@core/api/clients/base-client';

test.describe(
  'DELETE /api/users tests',
  {
    tag: '@users',
  },
  async () => {
    let user: UserEntity;
    let deletedUser: ApiResult<any>;

    test.beforeEach(async ({ api, spawnUser }) => {
      user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);
      deletedUser = await api.users.deleteUser();
    });

    test(
      '[USR-046] Successful deletion of an authorized user',
      {
        tag: '@smoke',
      },
      async ({ api, userRepository }) => {
        expect(deletedUser.response).toHaveStatus2xx;
        const dbUser = await userRepository.getById(user.id!);
        expect(dbUser).toBeNull();
      },
    );

    test(
      '[USR-047] User deletion without authorization',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        api.auth.clearTokens();
        expect(deletedUser.response).toHaveStatus4xx;
      },
    );

    test(
      '[USR-048] Login attempt with deleted account credentials',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        api.auth.setAccessToken('');
        const response = await api.auth.login({ identifier: user.email, password: user.password });
        expect(response.response).toHaveStatus(401);
      },
    );

    test(
      '[USR-049] Deletion of the deleted account',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const doubleDeletedUser = await api.users.deleteUser();
        expect(doubleDeletedUser.response).toHaveStatus(401);
      },
    );
  },
);
