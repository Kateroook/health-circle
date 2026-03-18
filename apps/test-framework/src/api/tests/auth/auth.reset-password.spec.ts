import { ConfirmationCodeDbEntity } from '../../../core/types/db/codes-and-files';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe.only('api/auth/reset-password tests', async () => {
    let user: UserEntity;
    let confirmationCode: ConfirmationCodeDbEntity;
    test.beforeEach(async ({api, spawnUser, confirmationCodeRepository}) => {
        user = await spawnUser();
        const forgotPassword = await api.auth.forgotPassword({email: user.email});
        expect(forgotPassword.response).toHaveStatus2xx();
        confirmationCode = (await confirmationCodeRepository.findBy({userId: user.id}))[0];
    });
  // | AUTH-039 | Успішне скидання пароля | Валідний email + код з БД + коректні паролі | 200 |
  test('[AUTH-039] Successful password reset', async ({ api }) => {
    const newPassword = utils.random.password(12);
    const resetPassword = await api.auth.resetPassword(
        user.email,
        confirmationCode.code,
        {
            newPassword: newPassword,
            confirmNewPassword: newPassword,
        }
    );
    
    expect(resetPassword.response).toHaveStatus2xx();
  });
  // TODO: | AUTH-040 | Невірний код | Валідний email + неправильний код | 400 або 401 |
  test('[AUTH-040] Wrong code for password reset', async ({ api }) => {
    const newPassword = utils.random.password(12);
    const resetPassword = await api.auth.resetPassword(
        user.email,
        '000000',
        {
            newPassword: newPassword,
            confirmNewPassword: newPassword,
        }
    );

    expect(resetPassword.response).toHaveStatus4xx();
    
    const login = await api.auth.login({
        identifier: user.email,
        password: newPassword,
    });

    expect(login.response).toHaveStatus4xx();

    
  });
  // TODO: | AUTH-041 | Паролі не збігаються | — | 400 |
  test('[AUTH-041] Password mismatch in password reset', async ({ api }) => {
    const newPassword = utils.random.password(12);
    const resetPassword = await api.auth.resetPassword(
        user.email,
        confirmationCode.code,
        {
            newPassword: newPassword,
            confirmNewPassword: newPassword+'1',
        }
    );
    
    expect(resetPassword.response).toHaveStatus4xx();
  });

  // TODO: | AUTH-042 - AUTH-046 | Пароль не відповідає вимогам | — | 400 |
  [{
        name: '[AUTH-042] Password reset with too short password', 
        newPassword: utils.random.password(11),
    }, {
        name: '[AUTH-043] Password reset with too long password', 
        newPassword: utils.random.password(21),
    }, {
        name: '[AUTH-044] Password reset with no lowercase letters', 
        newPassword: utils.random.password().toUpperCase(),
    }, {
        name: '[AUTH-045] Password reset with no uppercase letters', 
        newPassword: utils.random.password(10).toLowerCase(),
    }, {
        name: '[AUTH-046] Password reset with no numbers', 
        newPassword: 'OnlyLettersABC',
    }].forEach(options => test(options.name, async ({ api }) => {
        const resetPassword = await api.auth.resetPassword(
            user.email,
            confirmationCode.code,
            {
                newPassword: options.newPassword,
                confirmNewPassword: options.newPassword,
            }
        );
    
        expect(resetPassword.response).toHaveStatus4xx();

        const login = await api.auth.login({
            identifier: user.email,
            password: options.newPassword,
        });

        expect(login.response).toHaveStatus4xx();
    }));


  // TODO: | AUTH-047 | Логін зі старим паролем після скидання | Успішне reset-password | 401 |
  test('[AUTH-047] Login with old password after successful password reset', async ({ api }) => {
    const newPassword = utils.random.password(12);
    const resetPassword = await api.auth.resetPassword(
        user.email,
        confirmationCode.code,
        {
            newPassword: newPassword,
            confirmNewPassword: newPassword,
        }
    );
    
    expect(resetPassword.response).toHaveStatus2xx();

    const login = await api.auth.login({
        identifier: user.email,
        password: user.password,
    });

    expect(login.response).toHaveStatus4xx();
  });
  // TODO: | AUTH-048 | Логін з новим паролем після скидання | Успішне reset-password | 200 |
  test('[AUTH-048] Login with new password after successful password reset', async ({ api }) => {
    const newPassword = utils.random.password(12);
    const resetPassword = await api.auth.resetPassword(
        user.email,
        confirmationCode.code,
        {
            newPassword: newPassword,
            confirmNewPassword: newPassword,
        }
    );
    
    expect(resetPassword.response).toHaveStatus2xx();

    const login = await api.auth.login({
        identifier: user.email,
        password: newPassword,
    });

    expect(login.response).toHaveStatus2xx();
  });
});
