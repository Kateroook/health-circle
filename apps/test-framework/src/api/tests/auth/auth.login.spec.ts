import { test, expect } from "../../fixtures/api-fixture";
import { utils } from "../../../utils/utils";

test.describe.only("api/auth/login tests", async () => {
    test("[AUTH-001] Successfull login via email", async ({api, spawnUser}) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });

        expect(login.response).toHaveStatus2xx();
        expect(api.getContext().accessToken).not.toBeNull();
        expect(api.getContext().accessToken).not.toBeUndefined();
        expect(api.getContext().refreshToken).not.toBeNull();
        expect(api.getContext().refreshToken).not.toBeUndefined();
    });

    test("[AUTH-002] Successfull login via phone", async ({api, spawnUser}) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: user.phone,
            password: user.password,
        });

        expect(login.response).toHaveStatus2xx();
        expect(api.getContext().accessToken).not.toBeNull();
        expect(api.getContext().accessToken).not.toBeUndefined();
        expect(api.getContext().refreshToken).not.toBeNull();
        expect(api.getContext().refreshToken).not.toBeUndefined();
    });

    // AUTH-003	Неіснуючий email	nonexistent@test.com + будь-який пароль	401
    test("[AUTH-003] Log in with non existent emain", async ({api}) => {

        const login = await api.auth.login({
            identifier: 'non.existent.email@test.com',
            password: utils.random.password(),
        });

        expect(login.response).toHaveStatus(401);
    });

    // AUTH-004	Невірний пароль для існуючого акаунту	Валідний email + неправильний пароль	401
    test("[AUTH-004] Log in with wrong password", async ({api, spawnUser}) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: user.phone,
            password: user.password+'1',
        });

        expect(login.response).toHaveStatus(401);
    });

    // AUTH-005	Порожній пароль	Валідний email + ""	400
    test("[AUTH-005] Log in with empty password", async ({api, spawnUser}) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: user.email,
            password: '',
        });

        expect(login.response).toHaveStatus(401);
    });

    // TODO

    // AUTH-006	Порожній identifier	"" + валідний пароль	400
    test("[AUTH-006] Log in with empty identifier and valid password", async ({api, spawnUser}) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: '',
            password: user.password,
        });

        expect(login.response).toHaveStatus(401);
    });
    // AUTH-007	Пароль коротший за 12 символів	Валідний email + "Short1A"	400
    test("[AUTH-007] Log in with short password", async ({api, spawnUser}) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: user.email,
            password: user.password.substring(0, 10),
        });

        expect(login.response).toHaveStatus(401);
    });
    // AUTH-008	Пароль довший за 20 символів	Валідний email + 21-символьний рядок	400
    test("[AUTH-008] Successfull login via phone", async ({api, spawnUser}) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: user.email,
            password: user.password+user.password,
        });

        expect(login.response).toHaveStatus(401);
    });
    // AUTH-009	Логін з email у верхньому регістрі	USER@GMAIL.COM — email зареєстрований як user@gmail.com	200 (email нечутливий до регістру)
    test("[AUTH-009] Log in with email in upper case", async ({api, spawnUser}) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: user.email.toUpperCase(),
            password: user.password,
        });

        expect(login.response).toHaveStatus2xx();
        expect(api.getContext().accessToken).not.toBeNull();
        expect(api.getContext().accessToken).not.toBeUndefined();
        expect(api.getContext().refreshToken).not.toBeNull();
        expect(api.getContext().refreshToken).not.toBeUndefined();
    });
});