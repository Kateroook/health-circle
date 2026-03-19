import { expect, test } from "../../fixtures/api-fixture";
test.describe('api/auth/refresh tests', async () => {
    // | AUTH-016 | Отримання профілю авторизованого користувача | Виконано login | 200, тіло відповіді містить `id`, `firstName`, `lastName`, `email`, `phone` |
    test('[AUTH-016] Get authorized user profile with correct fields', async ({ api, spawnUser }) => {
        const user = await spawnUser();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus2xx();

        const profile = await api.auth.getProfile();

        expect(profile.response).toHaveStatus2xx();
        expect(profile.data).toEqual(
            expect.objectContaining({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email.toLowerCase(),
                phone: user.phone,
            }),
        );
    });

    // | AUTH-017 | Запит без авторизації | Без токена | 401 |
    test('[AUTH-017] Get user profile without token', async ({ api, spawnUser }) => {
        const profile = await api.auth.getProfile();
        expect(profile.response).toHaveStatus(401);
    });

    //TODO (if there isn't anything better) : | AUTH-018 | Відповідь відповідає схемі `UserProfileDto` | Виконано login | Всі обов'язкові поля присутні, типи коректні |
})