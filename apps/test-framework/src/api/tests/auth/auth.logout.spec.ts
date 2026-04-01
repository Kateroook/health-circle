import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/auth/logout tests',
  {
    tag: '@auth',
  },
  async () => {
    test('[AUTH-008] Successfull logout after login', async ({ api, spawnUser }) => {
      const user = await spawnUser();

      const login = await api.auth.login({
        identifier: user.email,
        password: user.password,
      });
      expect(login.response).toHaveStatus2xx();

      const logout = await api.auth.logout();

      expect(logout.response).toHaveStatus2xx();
      expect(api.getContext().accessToken).toBeUndefined();
      expect(api.getContext().refreshToken).toBeUndefined();
    });

    test('[AUTH-009] Logout without login', async ({ api }) => {
      const logout = await api.auth.logout();

      expect(logout.response).toHaveStatus(401);
      expect(api.getContext().accessToken).toBeUndefined();
      expect(api.getContext().refreshToken).toBeUndefined();
    });

    test('[AUTH-010] Access tokens are revoked after logout', async ({ api, spawnUser }) => {
      const user = await spawnUser();

      const login = await api.auth.login({
        identifier: user.email,
        password: user.password,
      });
      const clonedApi = api.cloneWithContext();
      expect(login.response).toHaveStatus2xx();

      const logout = await api.auth.logout();
      expect(logout.response).toHaveStatus2xx();

      const repeat = await clonedApi.auth.logout();
      expect(repeat.response).toHaveStatus(401);
    });
  },
);
