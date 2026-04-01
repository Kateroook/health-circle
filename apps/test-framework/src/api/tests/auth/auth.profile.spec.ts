import { expect, test } from '../../fixtures/api-fixture';
test.describe(
  'GET /api/auth/profile tests',
  {
    tag: '@auth',
  },
  async () => {
    test(
      '[AUTH-016] Get authorized user profile with correct fields',
      {
        tag: '@smoke',
      },
      async ({ api, spawnUser }) => {
        const user = await spawnUser();

        const login = await api.auth.login({
          identifier: user.email,
          password: user.password,
        });
        expect(login.response).toHaveStatus2xx();

        const profile = await api.auth.getProfile();

        expect(profile.response).toHaveStatus2xx();
        expect(profile.data).toEqual(
          expect.objectContaining({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email.toLowerCase(),
            phone: user.phone,
          }),
        );
      },
    );

    test(
      '[AUTH-017] Get user profile without token',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const profile = await api.auth.getProfile();
        expect(profile.response).toHaveStatus(401);
      },
    );

    //TODO (if there isn't anything better) : | AUTH-018 | Відповідь відповідає схемі `UserProfileDto` | Виконано login | Всі обов'язкові поля присутні, типи коректні |
  },
);
