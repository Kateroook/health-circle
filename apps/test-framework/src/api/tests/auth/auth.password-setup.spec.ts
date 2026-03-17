
// | AUTH-019 | Невірний код підтвердження | Валідний email + неправильний код | 400 або 401 |
// | AUTH-020 | Паролі не збігаються | `newPassword` ≠ `confirmNewPassword` | 400 |
// | AUTH-021 | Пароль коротший за 12 символів | `newPassword`: `"Short1A"` | 400 |
// | AUTH-022 | Пароль без великих літер | `newPassword`: `"alllowercase1"` | 400 |
// | AUTH-023 | Пароль без малих літер | `newPassword`: `"ALLUPPERCASE1"` | 400 |
// | AUTH-024 | Пароль без цифр | `newPassword`: `"OnlyLettersABC"` | 400 |
// | AUTH-025 | Пароль довший за 20 символів | 21-символьний рядок | 400 |
// | AUTH-026 | Повторне використання вже використаного коду | Старий код після успішного password-setup | 400 або 401 |
// | AUTH-027 | Старий код після відправки нового | `resendRegistrationCode` → спроба зі старим кодом | 400 або 401 |
import { UserFactory } from "../../../core/data/factories/user-factory";
import { ConfirmationCodeDbEntity } from "../../../core/types/db/codes-and-files";
import { UserEntity } from "../../../core/types/entites/user-interface";
import { expect, test } from "../../fixtures/api-fixture";
test.describe('api/auth/password-setup tests', async () => {
    let user: UserEntity;
    let confirmationCode: ConfirmationCodeDbEntity;
    test.beforeEach(async ({api, confirmationCodeRepository}) => {
        user = UserFactory.createRandomUser();

        const postUser = await api.users.createUser({
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
        });

        expect(postUser.response).toHaveStatus2xx();
        user.id = postUser.data.id;

        confirmationCode = (await confirmationCodeRepository.findBy({ userId: user.id }))[0];
    });
    // | AUTH-018 | Успішне встановлення пароля після реєстрації | Валідний email, код з БД, `newPassword` = `confirmNewPassword` | 201 |
    test('[AUTH-018] Successful password setup after registration', async ({ api, confirmationCodeRepository }) => {
        const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
            newPassword: user.password,
            confirmNewPassword: user.password,
        });

        expect(setupPassword.response).toHaveStatus2xx();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus2xx();
    });
})