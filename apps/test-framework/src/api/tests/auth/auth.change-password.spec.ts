import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/auth/change-password tests', async () => {
  let user: UserEntity;
  test.beforeEach('Create user and log in', async ({ spawnUser, api }) => {
    user = await spawnUser();
    await api.auth.login({
      identifier: user.email,
      password: user.password,
    });
  });

  test(
    '[AUTH-029] Successfull password change',
    {
      tag: ['@auth', '@smoke'],
    },
    async ({ api }) => {
      const newPassword = utils.random.password(12);
      const changePassword = await api.auth.changePassword({
        oldPassword: user.password,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      });

      expect(changePassword.response).toHaveStatus2xx();
    },
  );

  test(
    '[AUTH-030] Wrong old password for password change',
    {
      tag: ['@auth', '@smoke'],
    },
    async ({ api }) => {
      const newPassword = utils.random.password(12);
      const changePassword = await api.auth.changePassword({
        oldPassword: user.password + '1',
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      });

      expect(changePassword.response).toHaveStatus4xx();
    },
  );

  test(
    '[AUTH-031] Password mismatch in password change',
    {
      tag: ['@auth', '@sanity'],
    },
    async ({ api }) => {
      const newPassword = utils.random.password(12);
      const changePassword = await api.auth.changePassword({
        oldPassword: user.password,
        newPassword: newPassword,
        confirmNewPassword: newPassword + '2',
      });

      expect(changePassword.response).toHaveStatus4xx();
    },
  );

  [
    {
      testName: '[AUTH-032] Change password with short password',
      newPasword: utils.random.password(11),
      tags: ['@auth', '@sanity'],
    },
    {
      testName: '[AUTH-033] Change password without uppercase letters',
      newPasword: utils.random.string({ length: 12, includeUpper: false }),
      tags: ['@auth', '@sanity'],
    },
    {
      testName: '[AUTH-034] Change password without lowercase letters',
      newPasword: utils.random.string({ length: 12, includeLower: false }),
      tags: ['@auth', '@sanity'],
    },
    {
      testName: '[AUTH-035] Change password without numbers',
      newPasword: utils.random.string({ length: 12, includeNumbers: false }),
      tags: ['@auth', '@sanity'],
    },
    {
      testName: '[AUTH-036] Change password with password longer than 20 symbols',
      newPasword: utils.random.password(21),
      tags: ['@auth', '@sanity'],
    },
    {
      testName: '[AUTH-037] Change password without special symbols',
      newPasword: utils.random.string({ length: 12, includeSpecial: false }),
      tags: ['@auth', '@sanity'],
    },
  ].forEach((options) =>
    test(
      options.testName,
      {
        tag: options.tags,
      },
      async ({ api }) => {
        const changePassword = await api.auth.changePassword({
          oldPassword: user.password,
          newPassword: options.newPasword,
          confirmNewPassword: options.newPasword,
        });

        expect(changePassword.response).toHaveStatus4xx();
      },
    ),
  );

  test(
    '[AUTH-038] Password change without access token',
    {
      tag: ['@auth', '@smoke'],
    },
    async ({ api }) => {
      const logout = await api.auth.logout();
      expect(logout.response).toHaveStatus2xx();

      const newPassword = utils.random.password(12);
      const changePassword = await api.auth.changePassword({
        oldPassword: user.password,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      });

      expect(changePassword.response).toHaveStatus4xx();
    },
  );

  test(
    "[AUTH-039] Old password doesn't work after successfull password change",
    {
      tag: ['@auth', '@smoke'],
    },
    async ({ api }) => {
      const newPassword = utils.random.password(12);
      await api.auth.changePassword({
        oldPassword: user.password,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      });

      const logout = await api.auth.logout();
      expect(logout.response).toHaveStatus2xx();

      const login = await api.auth.login({
        identifier: user.email,
        password: user.password,
      });

      expect(login.response).toHaveStatus4xx();
      expect(api.getContext().accessToken).toBeUndefined();
      expect(api.getContext().refreshToken).toBeUndefined();
    },
  );

  test(
    '[AUTH-040] New password works after successfull password change',
    {
      tag: ['@auth', '@smoke'],
    },
    async ({ api }) => {
      const newPassword = utils.random.password(12);
      const changePassword = await api.auth.changePassword({
        oldPassword: user.password,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      });

      expect(changePassword.response).toHaveStatus2xx();

      const logout = await api.auth.logout();
      expect(logout.response).toHaveStatus2xx();

      const login = await api.auth.login({
        identifier: user.email,
        password: newPassword,
      });

      expect(login.response).toHaveStatus2xx();
    },
  );
});
