import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('Password resetting', () => {
  let user: any;

  test.beforeEach(async ({ api, spawnUser }) => {
    user = await spawnUser();
    await api.auth.quickLogin(user.email, user.password);
  });

  test('[USR-063] Successfull password reset', async ({ api }) => {
    const userWithNewPassword = await api.users.resetUserPassword(user.id!);
    expect(userWithNewPassword.response).toHaveStatus(200);
  });

  test('[USR-064] Password reset with random UUID', async ({ api }) => {
    const userWithNewPassword = await api.users.resetUserPassword(utils.random.uuid());
    expect(userWithNewPassword.response).toHaveStatus(404);
  });

  test('[USR-065] Password reset without authorization', async ({ api }) => {
    api.auth.clearTokens();
    const userWithNewPassword = await api.users.resetUserPassword(user.id!);
    expect(userWithNewPassword.response).toHaveStatus(401);
  });
});
