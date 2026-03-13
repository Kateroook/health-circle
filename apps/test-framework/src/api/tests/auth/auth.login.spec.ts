import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('api/auth/login tests', async () => {
  test('[AUTH-001] Successfull login via email', async ({ api, spawnUser }) => {
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

  test('[AUTH-002] Successfull login via phone', async ({ api, spawnUser }) => {
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

  test('[AUTH-003] Log in with email in upper case', async ({ api, spawnUser }) => {
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

  test('[AUTH-004] Log in with non existent emain', async ({ api }) => {
    const login = await api.auth.login({
      identifier: 'non.existent.email@test.com',
      password: utils.random.password(),
    });

    expect(login.response).toHaveStatus(401);
  });

  test('[AUTH-005] Log in with wrong password', async ({ api, spawnUser }) => {
    const user = await spawnUser();

    const login = await api.auth.login({
      identifier: user.phone,
      password: user.password + '1',
    });

    expect(login.response).toHaveStatus(401);
  });

  test('[AUTH-006] Log in with empty password', async ({ api, spawnUser }) => {
    const user = await spawnUser();

    const login = await api.auth.login({
      identifier: user.email,
      password: '',
    });

    expect(login.response).toHaveStatus(401);
  });

  test('[AUTH-007] Log in with empty identifier and valid password', async ({ api, spawnUser }) => {
    const user = await spawnUser();

    const login = await api.auth.login({
      identifier: '',
      password: user.password,
    });

    expect(login.response).toHaveStatus(401);
  });
});
