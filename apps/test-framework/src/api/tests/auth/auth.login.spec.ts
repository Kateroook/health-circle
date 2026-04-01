import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/auth/login tests',
  {
    tag: '@auth',
  },
  async () => {
    let user: UserEntity;
    test.beforeEach(async ({ spawnUser }) => {
      user = await spawnUser();
    });

    test(
      '[AUTH-001] Successfull login via email',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const login = await api.auth.login({
          identifier: user.email,
          password: user.password,
        });

        expect(login.response).toHaveStatus2xx();
        expect(api.getContext().accessToken).toBeDefined();
        expect(api.getContext().refreshToken).toBeDefined();
      },
    );

    test(
      '[AUTH-002] Successfull login via phone',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const login = await api.auth.login({
          identifier: user.phone,
          password: user.password,
        });

        expect(login.response).toHaveStatus2xx();
        expect(api.getContext().accessToken).toBeDefined();
        expect(api.getContext().refreshToken).toBeDefined();
      },
    );

    test(
      '[AUTH-003] Log in with email in upper case',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const login = await api.auth.login({
          identifier: user.email.toUpperCase(),
          password: user.password,
        });

        expect(login.response).toHaveStatus2xx();
        expect(api.getContext().accessToken).toBeDefined();
        expect(api.getContext().refreshToken).toBeDefined();
      },
    );

    [
      {
        name: '[AUTH-004] Log in with non existent email',
        identifier: 'non.existent.email@test.com',
        password: utils.random.password(),
        tags: '@sanity',
      },
      {
        name: '[AUTH-005] Log in with wrong password',
        identifier: undefined,
        password: utils.random.password(),
        tags: '@smoke',
      },
      {
        name: '[AUTH-006] Log in with empty password',
        identifier: undefined,
        password: '',
        tags: '@sanity',
      },
      {
        name: '[AUTH-007] Log in with empty identifier and valid password',
        identifier: '',
        password: undefined,
        tags: '@sanity',
      },
    ].forEach((options) => {
      test(options.name, { tag: options.tags }, async ({ api }) => {
        const login = await api.auth.login({
          identifier: options.identifier ?? user.email,
          password: options.password ?? user.password,
        });

        expect(login.response).toHaveStatus(401);
      });
    });
  },
);
