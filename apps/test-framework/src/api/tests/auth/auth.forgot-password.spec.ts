import { UserFactory } from '../../../core/data/factories/user-factory';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/auth/change-password tests', async () => {

  test('[AUTH-041] Forgot password request for existing email', async ({ api, spawnUser, confirmationCodeRepository }) => {
    const user = await spawnUser();
    const codeCountBefore = await confirmationCodeRepository.getUserCodeCount(user.id!);
    const forgotPassword = await api.auth.forgotPassword({
        email: user.email,
    });
    
    expect(forgotPassword.response).toHaveStatus2xx();

    const codeCountAfter = await confirmationCodeRepository.getUserCodeCount(user.id!);
    expect(codeCountAfter - codeCountBefore).toEqual(1);
  });

  test('[AUTH-042] Forgot password request for not registered email', async ({ api }) => {
    const user = UserFactory.createUserForTest({testId: 'auth-36'});
    const forgotPassword = await api.auth.forgotPassword({
        email: user.email,
    });
    expect(forgotPassword.response).toHaveStatus4xx();
  });

  test('[AUTH-043] Forgot password request for incorrect email', async ({ api }) => {
    const forgotPassword = await api.auth.forgotPassword({
        email: 'notanemail',
    });
    expect(forgotPassword.response).toHaveStatus4xx();
  });

  test('[AUTH-044] Forgot password request for an empty email', async ({ api }) => {
    const forgotPassword = await api.auth.forgotPassword({
        email: '',
    });
    expect(forgotPassword.response).toHaveStatus4xx();
  });
});
