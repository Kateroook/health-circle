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

    enum time_intervals {
      t_40s = 40000,
      t_60s = 60000,
      t_80s = 80000,
    }

    test.beforeEach(async ({ spawnUser, api }) => {
      userA = await spawnUser();
      await api.auth.quickLogin(userA.email, userA.password);
    });

    test(
      '[USR-078] Global status degradation',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        await api.users.updateUserStatus({ status: 'SAFE' });

        await utils.date.sleep(time_intervals.t_60s);

        await expect(async () => {
          const getUserA = await api.users.getUser(userA.id!);
          expect(getUserA.data.status).toBe('WAS_SAFE');
        }).toPass({ timeout: time_intervals.t_40s, intervals: [2000, 5000] });
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

        await utils.date.sleep(time_intervals.t_80s);

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

        await utils.date.sleep(time_intervals.t_40s);

        await api.users.updateUserStatus({ status: 'SAFE' });

        await utils.date.sleep(time_intervals.t_40s);

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
        await utils.date.sleep(time_intervals.t_60s);

        await expect(async () => {
          const getUserBeforeStatusChange = await api.users.getUser(userA.id!);
          expect(getUserBeforeStatusChange.data.status).toBe('WAS_SAFE');
        }).toPass({ timeout: time_intervals.t_40s, intervals: [2000, 5000] });

        await api.users.updateUserStatus({ status: 'SAFE' });

        const getUserAfterStatusChange = await api.users.getUser(userA.id!);
        expect(getUserAfterStatusChange.data.status).toBe('SAFE');
      },
    );

    test(
      '[USR-083] Manual status update to WAS_SAFE',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const updateRes = await api.users.updateUserStatus({ status: 'WAS_SAFE' as any });

        expect(updateRes.response.status()).toBe(200);

        const getUserA = await api.users.getUser(userA.id!);
        expect(getUserA.data.status).toBe('WAS_SAFE');
      },
    );
  },
);
