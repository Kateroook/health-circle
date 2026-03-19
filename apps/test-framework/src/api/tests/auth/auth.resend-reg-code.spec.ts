import { UserFactory } from "../../../core/data/factories/user-factory";
import { expect, test } from "../../fixtures/api-fixture";
test.describe('api/auth/refresh tests', async () => {

    test('[AUTH-056] Successful code resend', async ({ api, confirmationCodeRepository }) => {
        let user = UserFactory.createRandomUser();
        const postUser = await api.users.createUser({
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
        });
        expect(postUser.response).toHaveStatus2xx();
        user.id = postUser.data.id;

        const oldCode = (await confirmationCodeRepository.getLastUserCode(user.id)).code;

        const resendCode = await api.auth.resendRegistrationCode({
            email: user.email,
        });

        expect(resendCode.response).toHaveStatus2xx();

        const newCode = (await confirmationCodeRepository.getLastUserCode(user.id)).code;

        expect(oldCode).not.toEqual(newCode);
    });

    test('[AUTH-057] Resend registration code for non-registered email', async ({ api }) => {
        let user = UserFactory.createRandomUser();

        const resendCode = await api.auth.resendRegistrationCode({
            email: user.email,
        });

        expect(resendCode.response).toHaveStatus4xx();
    });
})