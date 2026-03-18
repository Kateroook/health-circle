import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/auth/change-password tests', async () => {
  let user: UserEntity;
  test.beforeEach(async ( { spawnUser, api} ) => {
    user = await spawnUser();
    await api.auth.login({
      identifier: user.email,
      password: user.password,
    });
  });

  // | AUTH-028 | Успішна зміна пароля | Авторизований, коректні `oldPassword`, `newPassword`, `confirmNewPassword` | 200 |
  test('[AUTH-028] Successfull password change', async ({ api, spawnUser }) => {
    const newPassword = utils.random.password(12);
    const changePassword = await api.auth.changePassword({
        oldPassword: user.password,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
    });

    expect(changePassword.response).toHaveStatus2xx();
  });
  // | AUTH-029 | Невірний поточний пароль | Авторизований, некоректний `oldPassword` | 401 |
  test('[AUTH-029] Wrong old password for password change', async ({ api, spawnUser }) => {
    const newPassword = utils.random.password(12);
    const changePassword = await api.auth.changePassword({
        oldPassword: user.password+'1',
        newPassword: newPassword,
        confirmNewPassword: newPassword,
    });

    expect(changePassword.response).toHaveStatus4xx();
  });
  // | AUTH-030 | Паролі не збігаються | Авторизований, `newPassword` ≠ `confirmNewPassword` | 400 |
  test('[AUTH-030] Password mismatch in password change', async ({ api, spawnUser }) => {
    const newPassword = utils.random.password(12);
    const changePassword = await api.auth.changePassword({
        oldPassword: user.password,
        newPassword: newPassword,
        confirmNewPassword: newPassword+'2',
    });

    expect(changePassword.response).toHaveStatus4xx();
  });
  // | AUTH-031 | Новий пароль не відповідає вимогам | Авторизований, короткий `newPassword` | 400 |
  test('[AUTH-031] Short new password in password change', async ({ api, spawnUser }) => {
    const newPassword = utils.random.password(11);
    const changePassword = await api.auth.changePassword({
        oldPassword: user.password,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
    });

    expect(changePassword.response).toHaveStatus4xx();
  });
  // | AUTH-032 | Запит без авторизації | Без токена | 401 |
  test('[AUTH-032] Password change without access token', async ({ api, spawnUser }) => {
    const logout = await api.auth.logout();
    expect(logout.response).toHaveStatus2xx();

    const newPassword = utils.random.password(12);
    const changePassword = await api.auth.changePassword({
        oldPassword: user.password,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
    });

    expect(changePassword.response).toHaveStatus4xx();
  });
  // | AUTH-033 | Старий пароль не працює після зміни | Виконано change-password | 401 при логіні зі старим паролем |
  test("[AUTH-033] Old password doesn't work after successfull password change", async ({ api, spawnUser }) => {
    const newPassword = utils.random.password(12);
    const changePassword = await api.auth.changePassword({
        oldPassword: user.password,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
    });

    const logout = await api.auth.logout();
    expect(logout.response).toHaveStatus2xx();

    const login = await api.auth.login({
        identifier: user.email,
        password: user.password,
    })

    expect(login.response).toHaveStatus4xx();
    expect(api.getContext().accessToken).toBeUndefined();
    expect(api.getContext().refreshToken).toBeUndefined();
  });
  // | AUTH-034 | Новий пароль працює після зміни | Виконано change-password | 200 при логіні з новим паролем |
  test('[AUTH-034] New password works after successfull password change', async ({ api, spawnUser }) => {
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
    })

    expect(login.response).toHaveStatus2xx();
  });
});
