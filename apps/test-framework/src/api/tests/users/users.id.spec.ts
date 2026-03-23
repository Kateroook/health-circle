import { faker } from '@faker-js/faker';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('Getting a user by id', () => {
  test('[USR-032] Getting an existing user by id', async ({ api, spawnUser }) => {
    const user = await spawnUser({ middleName: utils.random.middleName() });
    const loginUser = await api.auth.quickLogin(user.email, user.password);
    const userId = await api.getContext().userId!;
    const response = await api.users.getUser(userId);
    const fullName = `${user.firstName} ${user.lastName}`;
    await expect((await response).response).toHaveStatus(200);
    await expect((await response).data).toMatchObject({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      fullName: fullName,
      email: user.email.toLowerCase(),
      phone: user.phone,
    });
    await expect(response.data).not.toHaveProperty('password');
  });

  //має повертати 404
  test('[USR-033] Getting user by non-existent id', async ({ api, spawnUser }) => {
    const user = await spawnUser({ middleName: utils.random.middleName() });
    const loginUser = await api.auth.quickLogin(user.email, user.password);
    const userId = faker.string.uuid();
    const response = await api.users.getUser(userId);
    await expect((await response).response).toHaveStatus(403);
  });

  test('[USR-034] Getting an existing user by invalid format of id', async ({ api, spawnUser }) => {
    const user = await spawnUser({ middleName: utils.random.middleName() });
    const loginUser = await api.auth.quickLogin(user.email, user.password);
    const userId = utils.random.shortId(20);
    const response = await api.users.getUser(userId);
    await expect((await response).response).toHaveStatus(400);
  });

  test('[USR-035] Getting user by id witout authorizaion', async ({ api, spawnUser }) => {
    const userId = utils.random.shortId(20);
    const response = await api.users.getUser(userId);
    await expect((await response).response).toHaveStatus(401);
  });
});
