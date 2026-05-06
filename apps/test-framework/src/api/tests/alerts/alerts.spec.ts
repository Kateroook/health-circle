import { UserEntity } from '@core/types/entites/user-interface';
import { utils } from 'src/utils/utils';
import { timeout } from 'src/utils/wait-helper';
import { AlertRegion, AlertRegions } from '../../../core/data/regions';
import { expect, test } from '../../fixtures/api-fixture';

test.describe.serial('Module 10: Alerts API (Sequential)', async () => {
  let regions: AlertRegion[] = utils.random.pickFromObject(AlertRegions, 3) as AlertRegion[];
  test.describe('GET /api/alerts/active (Active alerts)', { tag: '@alerts' }, async () => {
    test.beforeEach(async ({ api, spawnUser }) => {
      const user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);

      await api.alertsMock.resetAll();
      await api.alerts.triggerSync();
    });

    test('[ALT-001] Get list with no active alerts', { tag: '@sanity' }, async ({ api }) => {
      const getAlerts = await api.alerts.getActiveAlerts();
      expect(getAlerts.response).toHaveStatus(200);
      expect(getAlerts.data).toEqual([]);
    });

    test('[ALT-002] Get list with one active alert', { tag: '@sanity' }, async ({ api }) => {
      await api.alertsMock.startAlert(regions[0]);
      await api.alerts.triggerSync();

      const getAlerts = await api.alerts.getActiveAlerts();
      expect(getAlerts.response).toHaveStatus(200);
      expect(getAlerts.data.length).toBe(1);
    });

    test('[ALT-003] Get list with few active alerts', { tag: '@sanity' }, async ({ api }) => {
      await api.alertsMock.startAlert(regions[0]);
      await api.alertsMock.startAlert(regions[1]);
      await api.alertsMock.startAlert(regions[2]);
      await api.alerts.triggerSync();

      const getAlerts = await api.alerts.getActiveAlerts();
      expect(getAlerts.response).toHaveStatus(200);
      expect(getAlerts.data.length).toBe(3);
    });

    test('[ALT-004] Get list with alerts without authorization', { tag: '@sanity' }, async ({ api }) => {
      api.alerts.clearTokens();
      const getAlerts = await api.alerts.getActiveAlerts();
      expect(getAlerts.response).toHaveStatus(401);
    });
  });

  test.describe('POST /api/alerts/trigger-sync (Sync trigger)', { tag: '@alerts' }, async () => {
    test.beforeEach(async ({ api, spawnUser }) => {
      const user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);
    });

    test('[ALT-005] Successfully synchronize alerts', { tag: '@sanity' }, async ({ api }) => {
      const syncTrigger = await api.alerts.triggerSync();
      expect(syncTrigger.response).toHaveStatus(201);
      expect(syncTrigger.data).not.toBeNull();
    });

    test('[ALT-006] Synchronize alerts two times', { tag: '@sanity' }, async ({ api }) => {
      await api.alerts.triggerSync();
      const syncTrigger = await api.alerts.triggerSync();

      expect(syncTrigger.response).toHaveStatus(201);
      expect(syncTrigger.data).not.toBeNull();
    });

    test('[ALT-007] Synchronize alerts without authorization', { tag: '@sanity' }, async ({ api }) => {
      api.alerts.clearTokens();
      const syncTrigger = await api.alerts.triggerSync();

      expect(syncTrigger.response).toHaveStatus(401);
    });
  });

  test.describe('GET /api/alerts/regions (Region list)', { tag: '@alerts' }, async () => {
    test.beforeEach(async ({ api, spawnUser }) => {
      const user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);
    });

    test('[ALT-008] Get regions from server', { tag: '@sanity' }, async ({ api }) => {
      const getRegions = await api.alerts.getRegions();

      expect(getRegions.response).toHaveStatus(200);
      expect(getRegions.data.length).toBeGreaterThan(0);
    });

    test('[ALT-009] Check structure of elements from regions', { tag: '@sanity' }, async ({ api }) => {
      const getRegions = await api.alerts.getRegions();

      expect(getRegions.response).toHaveStatus(200);
      const invalidElements = getRegions.data.filter((el) => el.uid == null || el.name == null || el.type == null);
      expect(invalidElements.length).toBe(0);
    });

    test('[ALT-010] Get regions from server without authorization', { tag: '@sanity' }, async ({ api }) => {
      api.alerts.clearTokens();
      const getRegions = await api.alerts.getRegions();

      expect(getRegions.response).toHaveStatus(401);
    });
  });

  test.describe('GET /api/alerts/status (User alert state)', { tag: '@alerts' }, async () => {
    let user: UserEntity;

    test.beforeEach(async ({ api, spawnUser }) => {
      user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);

      await api.alertsMock.resetAll();
      await api.alerts.triggerSync();
    });

    test('[ALT-011] Get status while no active alerts is present on server', { tag: '@smoke' }, async ({ api }) => {
      const getAlerts = await api.alerts.getMyAlertStatus();
      expect(getAlerts.response).toHaveStatus(200);
      expect(getAlerts.data.active).toBe(false);
    });

    test('[ALT-012] Get status while 1 active alerts is present on server', { tag: '@smoke' }, async ({ api }) => {
      await api.users.modifyUser({
        id: user.id!,
        alertRegionUid: regions[0].uid,
      } as any);

      await api.alertsMock.startAlert(regions[0]);
      await api.alerts.triggerSync();

      const statusRes = await api.alerts.getMyAlertStatus();
      expect(statusRes.response).toHaveStatus(200);
      expect(statusRes.data.active).toBe(true);
      expect(statusRes.data.userAlertRegionUid).toBe(regions[0].uid);
      expect(statusRes.data.alert).not.toBeNull();
    });

    test('[ALT-013] Check DTO structure', { tag: '@sanity' }, async ({ api }) => {
      await api.users.modifyUser({
        id: user.id!,
        alertRegionUid: regions[0].uid,
      } as any);
      await api.alertsMock.startAlert(regions[0]);
      await api.alerts.triggerSync();

      const statusRes = await api.alerts.getMyAlertStatus();
      const data = statusRes.data;

      expect(data).toMatchObject({
        active: expect.any(Boolean),
      });

      if (data.userAlertRegionUid !== null) {
        expect(typeof data.userAlertRegionUid).toBe('number');
      }

      if (data.alert !== null) {
        expect(data.alert).toMatchObject({
          id: expect.any(Number),
          locationUid: expect.any(Number),
          regionName: expect.any(String),
          alertType: expect.any(String),
          alertTypeRaw: expect.any(String),
          startedAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      }
    });

    test('[ALT-014] Check consistency with /active', { tag: '@smoke' }, async ({ api }) => {
      await api.users.modifyUser({
        id: user.id!,
        alertRegionUid: regions[0].uid,
      } as any);

      await api.alertsMock.startAlert(regions[1]);
      await api.alerts.triggerSync();

      const activeAlerts = await api.alerts.getActiveAlerts();
      expect(activeAlerts.data).toContain(regions[1].uid);

      const statusRes = await api.alerts.getMyAlertStatus();
      expect(statusRes.data.active).toBe(false);
      expect(statusRes.data.userAlertRegionUid).toBe(regions[0].uid);
    });

    test('[ALT-015] Get status of alerts without authorization', { tag: '@sanity' }, async ({ api }) => {
      api.alerts.clearTokens();

      const getAlerts = await api.alerts.getMyAlertStatus();
      expect(getAlerts.response).toHaveStatus(401);
    });
  });

  test.describe.serial('E2E: Alerts Flow', { tag: ['@alerts', '@e2e'] }, async () => {
    let user: UserEntity;

    test.beforeEach(async ({ api, spawnUser }) => {
      user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);

      await api.alertsMock.resetAll();
      await api.alerts.triggerSync();
    });

    test('[ALT-E2E-001] Sync -> Active: verify active alerts update after sync', { tag: '@smoke' }, async ({ api }) => {
      let activeAlerts = await api.alerts.getActiveAlerts();
      expect(activeAlerts.data).toEqual([]);

      await api.alertsMock.startAlert(regions[0]);
      await api.alerts.triggerSync();

      activeAlerts = await api.alerts.getActiveAlerts();
      expect(activeAlerts.data).toContain(regions[0].uid);
      expect(activeAlerts.data.length).toBe(1);
    });

    test(
      '[ALT-E2E-002] Sync -> Status: user status corresponds to new mocked data',
      { tag: '@smoke' },
      async ({ api }) => {
        await api.users.modifyUser({ id: user.id!, alertRegionUid: regions[0].uid } as any);

        await api.alertsMock.startAlert(regions[0]);
        await api.alerts.triggerSync();

        const statusRes = await api.alerts.getMyAlertStatus();
        expect(statusRes.data.active).toBe(true);
        expect(statusRes.data.userAlertRegionUid).toBe(regions[0].uid);
      },
    );

    test('[ALT-E2E-003] Active <-> Status consistency', { tag: '@smoke' }, async ({ api, spawnApi, spawnUser }) => {
      const newUser = await spawnUser();
      const noAlertApi = await spawnApi();
      await noAlertApi.auth.login({ identifier: newUser.email, password: newUser.password });

      await api.users.modifyUser({ id: user.id!, alertRegionUid: regions[0].uid } as any);
      await noAlertApi.users.modifyUser({ id: newUser.id!, alertRegionUid: regions[1].uid } as any);

      await api.alertsMock.startAlert(regions[0]);
      await api.alerts.triggerSync();

      const apiStatusRes = await api.alerts.getMyAlertStatus();
      const noAlertsStatusRes = await noAlertApi.alerts.getMyAlertStatus();

      expect(apiStatusRes.data.active).toBe(true);
      expect(noAlertsStatusRes.data.active).toBe(false);
    });

    test(
      '[ALT-E2E-004] Coordinates -> Alert matches user physical coordinates',
      { tag: ['@smoke', '@bug'] },
      async ({ api }) => {
        await api.users.modifyUser({
          id: user.id!,
          latitude: regions[0].coordinates?.latitude,
          longitude: regions[0].coordinates?.longitude,
        } as any);

        await api.alertsMock.startAlert(regions[0]);
        await api.alerts.triggerSync();

        await expect(async () => {
          const statusRes = await api.alerts.getMyAlertStatus();
          expect(statusRes.data.active).toBe(true);
          // Verify that the alert affecting the user is the one we started for the Oblast
          expect(statusRes.data.alert?.locationUid).toBe(regions[0].uid);
        }).toPass({ intervals: [timeout.cronTimeout, timeout.medium, timeout.long] });
      },
    );

    [
      {
        testName: '[ALT-E2E-005] Air alert automatically degrades user safety status',
        status: 'SAFE',
        expectedStatus: 'WAS_SAFE',
        tag: ['@smoke', '@bug'],
      },
      {
        testName: '[ALT-E2E-006] Air alert does not override existing DANGER status',
        status: 'DANGER',
        expectedStatus: 'DANGER',
        tag: ['@sanity', '@bug'],
      },
      {
        testName: '[ALT-E2E-007] Air alert does not override existing UNKNOWN status',
        status: 'UNKNOWN',
        expectedStatus: 'UNKNOWN',
        tag: ['@sanity', '@bug'],
      },
    ].forEach((options) =>
      test(
        options.testName,
        {
          tag: options.tag,
        },
        async ({ api }) => {
          await api.users.modifyUser({ id: user.id!, alertRegionUid: regions[0].uid } as any);
          await api.users.updateUserStatus({ status: options.status as any });

          await api.alertsMock.startAlert(regions[0]);
          await api.alerts.triggerSync();

          await expect(async () => {
            const userProfile = await api.users.getUser(user.id!);
            expect(userProfile.data.status).toBe(options.expectedStatus);
          }).toPass({ intervals: [timeout.cronTimeout, timeout.medium, timeout.long] });
        },
      ),
    );

    test('[ALT-E2E-008] Status updates correctly when alert stops', { tag: '@sanity' }, async ({ api }) => {
      await api.users.modifyUser({ id: user.id!, alertRegionUid: regions[0].uid } as any);

      await api.alertsMock.startAlert(regions[0]);
      await api.alerts.triggerSync();

      let statusRes = await api.alerts.getMyAlertStatus();
      expect(statusRes.data.active).toBe(true);

      await api.alertsMock.stopAlert(regions[0]);
      await api.alerts.triggerSync();

      statusRes = await api.alerts.getMyAlertStatus();
      expect(statusRes.data.active).toBe(false);
    });
  });
});
