import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('FCM Token Management', () => {
  let user: any;

  test.beforeEach(async ({ spawnUser }) => {
    user = await spawnUser();
  });

  test('[USR-066] Saving a FCM token', async ({ api, userRepository }) => {
    await api.auth.quickLogin(user.email, user.password);
    const randomFcmToken = utils.random.string({ length: utils.random.number({ min: 140, max: 250 }) });
    const response = await api.users.saveFcmToken(randomFcmToken);
    await expect(response.response).toHaveStatus(200);
    const dbUser = await userRepository.getById(user.id!);
    await expect(dbUser).toBeDefined();
    await expect(dbUser?.email).toBe(user.email.toLowerCase());
    await expect(dbUser?.phone).toBe(user.phone);
    await expect(dbUser?.firstName).toBe(user.firstName);
    await expect(dbUser?.lastName).toBe(user.lastName);
    await expect(dbUser?.middleName).toBe(null);
    await expect(dbUser?.fcmToken).toBe(randomFcmToken);
  });

  test('[USR-067] Updating an existing FCM token', async ({ api, userRepository }) => {
    await api.auth.quickLogin(user.email, user.password);
    const randomFcmToken = utils.random.string({ length: utils.random.number({ min: 140, max: 250 }) });
    await api.users.saveFcmToken(randomFcmToken);
    const dbUserWithFcmToken = await userRepository.getById(user.id!);
    await expect(dbUserWithFcmToken?.fcmToken).toBe(randomFcmToken);
    const newRandomFcmToken = utils.random.string({ length: utils.random.number({ min: 140, max: 250 }) });
    const response = await api.users.saveFcmToken(newRandomFcmToken);
    const dbUserWithNewFcmToken = await userRepository.getById(user.id!);
    await expect(response.response).toHaveStatus(200);
    await expect(dbUserWithNewFcmToken).toBeDefined();
    await expect(dbUserWithNewFcmToken?.email).toBe(user.email.toLowerCase());
    await expect(dbUserWithNewFcmToken?.phone).toBe(user.phone);
    await expect(dbUserWithNewFcmToken?.firstName).toBe(user.firstName);
    await expect(dbUserWithNewFcmToken?.lastName).toBe(user.lastName);
    await expect(dbUserWithNewFcmToken?.middleName).toBe(null);
    await expect(dbUserWithNewFcmToken?.fcmToken).toBe(newRandomFcmToken);
  });

  test('[USR-068] Saving a FCM token without authorization', async ({ api, spawnUser, userRepository }) => {
    const user = await spawnUser();
    const randomFcmToken = utils.random.string({ length: utils.random.number({ min: 140, max: 250 }) });
    const response = await api.users.saveFcmToken(randomFcmToken);
    await expect(response.response).toHaveStatus(401);
  });
});
