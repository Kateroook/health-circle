import { UserFactory } from "../../../core/data/factories/user-factory";
import { ConfirmationCodeDbEntity } from "../../../core/types/db/codes-and-files";
import { UserEntity } from "../../../core/types/entites/user-interface";
import { utils } from "../../../utils/utils";
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

        confirmationCode = await confirmationCodeRepository.getLastUserCode(user.id);
    });

    // | AUTH-018 | Успішне встановлення пароля після реєстрації | Валідний email, код з БД, `newPassword` = `confirmNewPassword` | 201 |
    test('[AUTH-018] Successful password setup after registration', async ({ api }) => {
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

    // | AUTH-019 | Невірний код підтвердження | Валідний email + неправильний код | 400 або 401 |
    test('[AUTH-019] Wrong confirmation code for password setup', async ({ api }) => {
        const setupPassword = await api.auth.setupPassword(user.email!, '000000', {
            newPassword: user.password,
            confirmNewPassword: user.password,
        });

        expect(setupPassword.response).toHaveStatus4xx();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus4xx();
    });
    // | AUTH-020 | Паролі не збігаються | `newPassword` ≠ `confirmNewPassword` | 400 |
    test("[AUTH-020] Passwords don't match in password setup", async ({ api }) => {
        const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
            newPassword: user.password,
            confirmNewPassword: user.password+"1",
        });

        expect(setupPassword.response).toHaveStatus4xx();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus4xx();
    });
    // | AUTH-021 | Пароль коротший за 12 символів | `newPassword`: `"Short1A"` | 400 |
    test("[AUTH-021] Passwords setup with short password", async ({ api }) => {
        user.password = user.password.substring(0, 11);
        const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
            newPassword: user.password,
            confirmNewPassword: user.password,
        });

        expect(setupPassword.response).toHaveStatus4xx();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus4xx();
    });
    // | AUTH-022 | Пароль без великих літер | `newPassword`: `"alllowercase1"` | 400 |
    test("[AUTH-022] Passwords setup without uppercase letters", async ({ api }) => {
        // user.password = user.password.toLowerCase(); // sometimes fails due to BE bug
        user.password = "alllowercase1";
        const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
            newPassword: user.password,
            confirmNewPassword: user.password,
        });

        expect(setupPassword.response).toHaveStatus4xx();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus4xx();
    });
    // | AUTH-023 | Пароль без малих літер | `newPassword`: `"ALLUPPERCASE1"` | 400 |
    test("[AUTH-023] Passwords setup without lowercase letters", async ({ api }) => {
        // user.password = user.password.toUpperCase(); // sometimes fails due to BE bug
        user.password = "ALLUPPERCASE1";
        const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
            newPassword: user.password,
            confirmNewPassword: user.password,
        });

        expect(setupPassword.response).toHaveStatus4xx();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus4xx();
    });
    // | AUTH-024 | Пароль без цифр | `newPassword`: `"OnlyLettersABC"` | 400 |
    test("[AUTH-024] Passwords setup without numbers", async ({ api }) => {
        user.password = "OnlyLettersABC";
        const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
            newPassword: user.password,
            confirmNewPassword: user.password,
        });

        expect(setupPassword.response).toHaveStatus4xx();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus4xx();
    });
    // | AUTH-025 | Пароль довший за 20 символів | 21-символьний рядок | 400 |
    test("[AUTH-025] Passwords setup without password longer than 20 symbols", async ({ api }) => {
        user.password = utils.random.password(21);
        const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
            newPassword: user.password,
            confirmNewPassword: user.password,
        });

        expect(setupPassword.response).toHaveStatus4xx();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus4xx();
    });
    // | AUTH-026 | Повторне використання вже використаного коду | Старий код після успішного password-setup | 400 або 401 |
    test("[AUTH-026] Passwords setup with the same code twice", async ({ api }) => {
        const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
            newPassword: user.password,
            confirmNewPassword: user.password,
        });

        expect(setupPassword.response).toHaveStatus2xx();
        
        const newPassword = utils.random.password();
        const repeatSetup = await api.auth.setupPassword(user.email!, confirmationCode.code, {
            newPassword: newPassword,
            confirmNewPassword: newPassword,
        });

        expect(repeatSetup.response).toHaveStatus4xx();

        const loginWithNewPassword = await api.auth.login({
            identifier: user.email,
            password: newPassword,
        });
        expect(loginWithNewPassword.response).toHaveStatus4xx();

        const loginWithOldPassword = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(loginWithOldPassword.response).toHaveStatus2xx();
    });
    // | AUTH-027 | Старий код після відправки нового | `resendRegistrationCode` → спроба зі старим кодом | 400 або 401 |
    test("[AUTH-027] Passwords setup with the old code", async ({ api, confirmationCodeRepository }) => {
        const resendCode = await api.auth.resendRegistrationCode({email: user.email});
        expect(resendCode.response).toHaveStatus2xx();
        const newCode = await confirmationCodeRepository.getLastUserCode(user.id!);

        const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
            newPassword: user.password,
            confirmNewPassword: user.password,
        });

        expect(setupPassword.response).toHaveStatus4xx();
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus4xx();

        const setupPasswordWithNewCode = await api.auth.setupPassword(user.email!, newCode.code!, {
            newPassword: user.password,
            confirmNewPassword: user.password,
        });

        expect(setupPasswordWithNewCode.response).toHaveStatus2xx();
        
        const loginAgain = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(loginAgain.response).toHaveStatus2xx();
    });
})