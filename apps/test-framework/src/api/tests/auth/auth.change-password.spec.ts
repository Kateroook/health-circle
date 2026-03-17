// | AUTH-029 | Невірний поточний пароль | Авторизований, некоректний `oldPassword` | 401 |
// | AUTH-030 | Паролі не збігаються | Авторизований, `newPassword` ≠ `confirmNewPassword` | 400 |
// | AUTH-031 | Новий пароль не відповідає вимогам | Авторизований, короткий `newPassword` | 400 |
// | AUTH-032 | Запит без авторизації | Без токена | 401 |
// | AUTH-033 | Старий пароль не працює після зміни | Виконано change-password | 401 при логіні зі старим паролем |
// | AUTH-034 | Новий пароль працює після зміни | Виконано change-password | 200 при логіні з новим паролем |
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
});
