import { UserEntity } from '@core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('Getting an authorized user by id ', () => {
  let user: UserEntity;

  test.beforeEach(async ({ api, spawnUser }) => {
    user = await spawnUser({ middleName: utils.random.middleName() });
    await api.auth.quickLogin(user.email, user.password);
  });

  test('[USR-032] Getting an existing user by id', async ({ api }) => {
    const userId = api.getContext().userId!;
    const response = await api.users.getUser(userId);
    expect(response.response).toHaveStatus(200);
    expect(response.data).toMatchObject({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName ?? null,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email.toLowerCase(),
      phone: user.phone,
    });
    expect(response.data).not.toHaveProperty('password');
  });

  //має повертати 404
  test('[USR-033] Getting user by non-existent id', async ({ api }) => {
    const userId = utils.random.uuid();
    const response = await api.users.getUser(userId);
    expect(response.response).toHaveStatus(403);
  });

  test('[USR-034] Getting an existing user by invalid format of id', async ({ api }) => {
    const userId = utils.random.shortId(20);
    const response = await api.users.getUser(userId);
    expect(response.response).toHaveStatus(400);
  });

  test('[USR-035] Getting a user by id without authorization', async ({ api }) => {
    api.auth.clearTokens();
    const response = await api.users.getUser(user.id!);
    expect(response.response).toHaveStatus(401);
  });
});
