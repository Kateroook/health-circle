import { UserFactory } from "../../../core/data/factories/user-factory";
import { utils } from "../../../utils/utils";
import { expect, test } from "../../fixtures/api-fixture";
test.describe('api/auth/refresh tests', async () => {
    // | AUTH-E2E-001 | Повний registration flow    | `createUser` → `resendCode` → `setupPassword` → `login` → `getProfile` → порівняти дані           |
    test('[AUTH-E2E-001] Full registration flow with code resending', async ({ api, confirmationCodeRepository }) => {
        let user = UserFactory.createRandomUser();
        const postUser = await api.users.createUser({
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
        });
        expect(postUser.response).toHaveStatus2xx();
        user.id = postUser.data.id;

        expect(user).toEqual(
            expect.objectContaining({
                firstName: postUser.data.firstName,
                lastName: postUser.data.lastName,
                phone: postUser.data.phone,
            }),
        );

        const resendCode = await api.auth.resendRegistrationCode({
            email: user.email,
        });
        expect(resendCode.response).toHaveStatus2xx();

        const code = (await confirmationCodeRepository.getLastUserCode(user.id)).code;

        const setupPassword = await api.auth.setupPassword(
            user.email,
            code,
            {
                newPassword: user.password,
                confirmNewPassword: user.password,
            }
        );
        expect(setupPassword.response).toHaveStatus2xx();

        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus2xx();

        const profile = await api.auth.getProfile();
        expect(profile.response).toHaveStatus2xx();
        expect(user).toEqual(
            expect.objectContaining({
                id: profile.data.id,
                firstName: profile.data.firstName,
                lastName: profile.data.lastName,
                phone: profile.data.phone,
            }),
        );
    });

    // | AUTH-E2E-002 | Повний forgot-password flow | `forgotPassword` → отримати код з БД → `resetPassword` → `login` з новим паролем        |
    test('[AUTH-E2E-002] Full forgot password flow', async ({ api, confirmationCodeRepository, spawnUser }) => {
        const user = await spawnUser();
        const newPassword = utils.random.password();

        const forgotPassword = await api.auth.forgotPassword({
            email: user.email,
        });
        expect(forgotPassword.response).toHaveStatus2xx();

        const code = (await confirmationCodeRepository.findBy({userId: user.id}))[0].code;

        const resetPassword = await api.auth.resetPassword(
            user.email,
            code,
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

    // | AUTH-E2E-003 | Refresh token flow          | `login` → `refreshToken` → `getProfile` зі старим access token (401) → `getProfile` з новим (200) |
    test('[AUTH-E2E-003] Full refresh token flow', async ({ api, spawnUser }) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus2xx();

        const oldApi = api.cloneWithContext();
        
        const refreshToken = await api.auth.refreshToken();
        expect(refreshToken.response).toHaveStatus2xx();

        const getProfileWithOldTokens = await oldApi.auth.getProfile();
        expect(getProfileWithOldTokens.response).toHaveStatus4xx();

        const getProfileWithNewTokens = await api.auth.getProfile();
        expect(getProfileWithNewTokens.response).toHaveStatus2xx();         
    });
})