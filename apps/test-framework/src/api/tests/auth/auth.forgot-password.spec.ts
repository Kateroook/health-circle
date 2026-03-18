import { UserFactory } from '../../../core/data/factories/user-factory';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/auth/change-password tests', async () => {
  // | AUTH-035 | Запит на скидання для існуючого email | Зареєстрований email | 200 |
  test('[AUTH-035] Forgot password request for existing email', async ({ api, spawnUser, confirmationCodeRepository }) => {
    const user = await spawnUser();
    const codeCountBefore = await confirmationCodeRepository.getUserCodeCount(user.id!);
    const forgotPassword = await api.auth.forgotPassword({
        email: user.email,
    });
    
    expect(forgotPassword.response).toHaveStatus2xx();

    const codeCountAfter = await confirmationCodeRepository.getUserCodeCount(user.id!);
    expect(codeCountAfter - codeCountBefore).toEqual(1);
  });
  // | AUTH-036 | Запит на скидання для незареєстрованого email | Випадковий email | 400 |
  test('[AUTH-036] Forgot password request for not registered email', async ({ api }) => {
    const user = UserFactory.createUserForTest({testId: 'auth-36'});
    const forgotPassword = await api.auth.forgotPassword({
        email: user.email,
    });
    expect(forgotPassword.response).toHaveStatus4xx();
  });
  // | AUTH-037 | Некоректний формат email | `notanemail` | 400 |
  test('[AUTH-037] Forgot password request for incorrect email', async ({ api }) => {
    const forgotPassword = await api.auth.forgotPassword({
        email: 'notanemail',
    });
    expect(forgotPassword.response).toHaveStatus4xx();
  });
  // | AUTH-038 | Порожній email | `""` | 400 |
  test('[AUTH-038] Forgot password request for an empty email', async ({ api }) => {
    const forgotPassword = await api.auth.forgotPassword({
        email: '',
    });
    expect(forgotPassword.response).toHaveStatus4xx();
  });
});
