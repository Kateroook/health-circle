import { UserEntity } from '@core/types/entites/user-interface';
import { utils } from 'src/utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'api/users/state-flow',
  {
    tag: ['@users'],
  },
  async () => {
    let userA: UserEntity;
    test.setTimeout(120000);

    test.beforeEach(async ({ spawnUser, api }) => {
      userA = await spawnUser();
      await api.auth.quickLogin(userA.email, userA.password);
    });

    test(
      '[USR-078] Global status degradation', //flaky
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await api.users.updateUserStatus({ status: 'SAFE' });

        await utils.date.sleep(60000);

        await expect(async () => {
          const getUserA = await api.users.getUser(userA.id!);
          expect(getUserA.data.status).toBe('WAS_SAFE');
        }).toPass({ timeout: 20000, intervals: [2000, 5000] });
      },
    );

    [
      {
        testName: '[USR-079] DANGER status does not degrade over time',
        status: 'DANGER',
        tag: '@smoke',
      },
      {
        testName: '[USR-080] UNKNOWN status does not degrade over time',
        status: 'UNKNOWN',
        tag: '@smoke',
      },
    ].forEach((options) =>
      test(options.testName, async ({ api }) => {
        await api.users.updateUserStatus({ status: options.status as any });

        await utils.date.sleep(82000);

        const getUserA = await api.users.getUser(userA.id!);
        expect(getUserA.data.status).toBe(options.status);
      }),
    );

    test(
      '[USR-081] Manual status update resets expiry timer',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await api.users.updateUserStatus({ status: 'SAFE' });

        await utils.date.sleep(40000);

        await api.users.updateUserStatus({ status: 'SAFE' });

        await utils.date.sleep(42000);

        const getUserA = await api.users.getUser(userA.id!);
        expect(getUserA.data.status).toBe('SAFE');
      },
    );

    test(
      '[USR-082] Recovery from degraded state',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await api.users.updateUserStatus({ status: 'SAFE' });
        await utils.date.sleep(60000);

        await expect(async () => {
          const getUsrBeforeSTChange = await api.users.getUser(userA.id!);
          expect(getUsrBeforeSTChange.data.status).toBe('WAS_SAFE');
        }).toPass({ timeout: 20000, intervals: [2000, 5000] });

        await api.users.updateUserStatus({ status: 'SAFE' });

        const getUsrAfterSTChange = await api.users.getUser(userA.id!);
        expect(getUsrAfterSTChange.data.status).toBe('SAFE');
      },
    );
  },
);
