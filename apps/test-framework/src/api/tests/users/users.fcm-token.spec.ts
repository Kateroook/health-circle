import { UserEntity } from '@core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'PUT /api/users/fcm-token tests',
  {
    tag: '@users',
  },
  async () => {
    let user: UserEntity;

    test.beforeEach(async ({ spawnUser }) => {
      user = await spawnUser();
    });

    test(
      '[USR-066] Saving a FCM token',
      {
        tag: '@smoke',
      },
      async ({ api, userRepository }) => {
        await api.auth.quickLogin(user.email, user.password);
        const randomFcmToken = utils.random.string({ length: utils.random.number({ min: 140, max: 250 }) });
        const response = await api.users.saveFcmToken(randomFcmToken);
        expect(response.response).toHaveStatus(200);
        const dbUser = await userRepository.getById(user.id!);
        expect(dbUser).toBeDefined();
        expect(dbUser).toMatchObject({
          email: user.email.toLowerCase(),
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: null,
          fcmToken: randomFcmToken,
        });
      },
    );

    test(
      '[USR-067] Updating an existing FCM token',
      {
        tag: '@smoke',
      },
      async ({ api, userRepository }) => {
        await api.auth.quickLogin(user.email, user.password);
        const randomFcmToken = utils.random.string({ length: utils.random.number({ min: 140, max: 250 }) });
        await api.users.saveFcmToken(randomFcmToken);
        const dbUserWithFcmToken = await userRepository.getById(user.id!);
        expect(dbUserWithFcmToken?.fcmToken).toBe(randomFcmToken);
        const newRandomFcmToken = utils.random.string({ length: utils.random.number({ min: 140, max: 250 }) });
        const response = await api.users.saveFcmToken(newRandomFcmToken);
        const dbUserWithNewFcmToken = await userRepository.getById(user.id!);
        expect(response.response).toHaveStatus(200);
        expect(dbUserWithNewFcmToken).toBeDefined();
        expect(dbUserWithNewFcmToken).toMatchObject({
          email: user.email.toLowerCase(),
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: null,
          fcmToken: newRandomFcmToken,
        });
      },
    );

    test(
      '[USR-068] Saving a FCM token without authorization',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const randomFcmToken = utils.random.string({ length: utils.random.number({ min: 140, max: 250 }) });
        const response = await api.users.saveFcmToken(randomFcmToken);
        expect(response.response).toHaveStatus(401);
      },
    );
  },
);
