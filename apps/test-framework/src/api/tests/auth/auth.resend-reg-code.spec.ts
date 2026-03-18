import { UserFactory } from "../../../core/data/factories/user-factory";
import { expect, test } from "../../fixtures/api-fixture";
test.describe('api/auth/refresh tests', async () => {
    // | AUTH-049 | Успішна повторна відправка коду | Виконано createUser, токен не встановлений | 200 |
    test('[AUTH-049] Successful code resend', async ({ api, confirmationCodeRepository }) => {
        let user = UserFactory.createRandomUser();
        const postUser = await api.users.createUser({
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
        });
        expect(postUser.response).toHaveStatus2xx();
        user.id = postUser.data.id;

        const codeCountBefore = (await confirmationCodeRepository.findBy({userId: user.id})).length;


        const resendCode = await api.auth.resendRegistrationCode({
            email: user.email,
        });

        expect(resendCode.response).toHaveStatus2xx();

        const codeCountAfter = (await confirmationCodeRepository.findBy({userId: user.id})).length;

        expect(codeCountAfter - codeCountBefore).toEqual(1);
    });

    // | AUTH-050 | Запит для незареєстрованого емейлу | Без токена | 401 |
    test('[AUTH-050] Resend registration code for non-registered email', async ({ api }) => {
        let user = UserFactory.createRandomUser();

        const resendCode = await api.auth.resendRegistrationCode({
            email: user.email,
        });

        expect(resendCode.response).toHaveStatus4xx();
    });
})