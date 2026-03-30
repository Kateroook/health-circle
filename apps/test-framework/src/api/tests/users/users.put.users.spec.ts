import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('User modification', () => {
  [
    {
      testName: '[USR-036] Successful name change',
      data: { firstName: utils.random.firstName() },
      expectedStatus: 200,
    },
    {
      testName: '[USR-037] Successful last name change',
      data: { lastName: utils.random.lastName() },
      expectedStatus: 200,
    },
    {
      testName: '[USR-038] Successful middle name change',
      data: { middleName: utils.random.middleName() },
      expectedStatus: 200,
    },
    {
      testName: '[USR-039] Successful phone change',
      data: { phone: utils.random.phone() },
      expectedStatus: 200,
    },
    {
      testName: '[USR-041] First name change with 1 symbol',
      data: { firstName: utils.random.shortId(1) },
      expectedStatus: 400,
    },
    {
      testName: '[USR-042] First name change with 51 symbols',
      data: { lastName: utils.random.shortId(51) },
      expectedStatus: 400,
    },
    {
      testName: '[USR-043] Last name change with less than 2 symbols',
      data: { firstName: utils.random.shortId(51) },
      expectedStatus: 400,
    },
  ].forEach((options) => {
    test(options.testName, async ({ api, spawnUser, userRepository }) => {
      const user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);
      const response = await api.users.modifyUser({
        id: user.id!,
        ...options.data,
      });

      expect(response.response).toHaveStatus(options.expectedStatus);

      if (options.expectedStatus === 200) {
        const dbUser = await userRepository.getById(user.id!);
        if (dbUser) {
          for (const key in options.data) {
            const expectedValue = (options.data as any)[key];
            const actualValue = (dbUser as any)[key];
            expect(actualValue).toBe(expectedValue);
          }
        }
      }
    });
  });

  test('[USR-040] Changing the phone to another user`s phone', async ({ api, spawnUser }) => {
    const userB = await spawnUser();
    const userA = await spawnUser();
    await api.auth.quickLogin(userA.email, userA.password);
    const response = await api.users.modifyUser({
      id: userA.id!,
      phone: userB.phone,
    });

    expect(response.response).toHaveStatus4xx;
  });

  test('[USR-044] Request without id field', async ({ api, spawnUser }) => {
    const user = await spawnUser();
    await api.auth.quickLogin(user.email, user.password);
    const response = await api.users.modifyUser({
      firstName: utils.random.firstName(),
    } as any);

    expect(response.response).toHaveStatus(400);
  });

  test('[USR-045] Request without authorization (no token)', async ({ api, spawnUser }) => {
    const user = await spawnUser();
    await api.auth.logout();
    const response = await api.users.modifyUser({
      id: user.id!,
      firstName: utils.random.firstName(),
      lastName: utils.random.lastName(),
      middleName: utils.random.middleName(),
      phone: utils.random.phone(),
    });
    expect(response.response).toHaveStatus(401);
  });
});
