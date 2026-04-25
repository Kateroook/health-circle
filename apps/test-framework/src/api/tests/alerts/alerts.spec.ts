import { UserEntity } from '@core/types/entites/user-interface';
import { AlertRegions, RegionCoordinates } from '../../../core/data/regions';
import { expect, test } from '../../fixtures/api-fixture';

test.describe.serial('Module 10: Alerts API (Sequential)', async () => {
  test.describe('GET /api/alerts/active Активні тривоги', { tag: '@alerts' }, async () => {
    test.beforeEach(async ({ api, spawnUser }) => {
      const user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);

      await api.alertsMock.resetAll();
      await api.alerts.triggerSync();
    });

    test('[ALT-001] Get list with no active alerts', async ({ api }) => {
      const getAlerts = await api.alerts.getActiveAlerts();
      expect(getAlerts.response.status()).toBe(200);
      expect(getAlerts.data).toEqual([]);
    });

    test('[ALT-002] Get list with one active alert', { tag: '@sanity' }, async ({ api }) => {
      await api.alertsMock.startAlert(AlertRegions.KYIV_OBLAST);
      await api.alerts.triggerSync();

      const getAlerts = await api.alerts.getActiveAlerts();
      expect(getAlerts.response.status()).toBe(200);
      expect(getAlerts.data.length).toBe(1);
    });

    test('[ALT-003] Get list with few active alerts', { tag: '@sanity' }, async ({ api }) => {
      await api.alertsMock.startAlert(AlertRegions.KYIV_OBLAST);
      await api.alertsMock.startAlert(AlertRegions.LVIV_OBLAST);
      await api.alertsMock.startAlert(AlertRegions.ODESA_OBLAST);
      await api.alerts.triggerSync();

      const getAlerts = await api.alerts.getActiveAlerts();
      expect(getAlerts.response.status()).toBe(200);
      expect(getAlerts.data.length).toBe(3);
    });

    test('[ALT-004] Get list with alerts without authorization', { tag: '@sanity' }, async ({ api }) => {
      api.alerts.clearTokens();
      const getAlerts = await api.alerts.getActiveAlerts();
      expect(getAlerts.response.status()).toBe(401);
    });
  });

  test.describe('POST /api/alerts/trigger-sync Тригер синхронізації', { tag: '@alerts' }, async () => {
    test.beforeEach(async ({ api, spawnUser }) => {
      const user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);
    });

    test('[ALT-005] Successfully synchronize alerts', { tag: '@sanity' }, async ({ api }) => {
      const syncTrigger = await api.alerts.triggerSync();
      expect(syncTrigger.response.status()).toBe(201);
      expect(syncTrigger.data).not.toBeNull();
    });

    test('[ALT-006] Synchronize alerts two times', { tag: '@sanity' }, async ({ api }) => {
      await api.alerts.triggerSync();
      const syncTrigger = await api.alerts.triggerSync();

      expect(syncTrigger.response.status()).toBe(201);
      expect(syncTrigger.data).not.toBeNull();
    });

    test('[ALT-007] Synchronize alerts without authorization', { tag: '@sanity' }, async ({ api }) => {
      api.alerts.clearTokens();
      const syncTrigger = await api.alerts.triggerSync();

      expect(syncTrigger.response.status()).toBe(401);
    });
  });

  test.describe('GET /api/alerts/regions Список регіонів', { tag: '@alerts' }, async () => {
    test.beforeEach(async ({ api, spawnUser }) => {
      const user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);
    });

    test('[ALT-008] Get regions from server', { tag: '@sanity' }, async ({ api }) => {
      const getRegions = await api.alerts.getRegions();

      expect(getRegions.response.status()).toBe(200);
      expect(getRegions.data.length).toBeGreaterThan(0);
    });

    test('[ALT-009] Check structure of elments from regions', { tag: '@sanity' }, async ({ api }) => {
      const getRegions = await api.alerts.getRegions();

      expect(getRegions.response.status()).toBe(200);
      const invalidElements = getRegions.data.filter((el) => el.uid == null || el.name == null || el.type == null);
      expect(invalidElements.length).toBe(0);
    });

    test('[ALT-010] Get regions from server without authorization', { tag: '@sanity' }, async ({ api }) => {
      api.alerts.clearTokens();
      const getRegions = await api.alerts.getRegions();

      expect(getRegions.response.status()).toBe(401);
    });
  });

  test.describe('GET /api/alerts/status Статус тривоги користувача', { tag: '@alerts' }, async () => {
    let user: UserEntity;

    test.beforeEach(async ({ api, spawnUser }) => {
      user = await spawnUser();
      await api.auth.quickLogin(user.email, user.password);

      await api.alertsMock.resetAll();
      await api.alerts.triggerSync();
    });

    test('[ALT-011] Get status while no active alerts is present on server', { tag: '@sanity' }, async ({ api }) => {
      const getAlerts = await api.alerts.getMyAlertStatus();
      expect(getAlerts.response.status()).toBe(200);
      expect(getAlerts.data.active).toBe(false);
    });

    test('[ALT-012] Get status while 1 active alerts is present on server', { tag: '@sanity' }, async ({ api }) => {
      await api.users.modifyUser({
        id: user.id!,
        alertRegionUid: AlertRegions.KYIV_OBLAST.uid,
      } as any);

      await api.alertsMock.startAlert(AlertRegions.KYIV_OBLAST);
      await api.alerts.triggerSync();

      const statusRes = await api.alerts.getMyAlertStatus();
      expect(statusRes.response.status()).toBe(200);
      expect(statusRes.data.active).toBe(true);
      expect(statusRes.data.userAlertRegionUid).toBe(AlertRegions.KYIV_OBLAST.uid);
      expect(statusRes.data.alert).not.toBeNull();
    });

    test('[ALT-013] Check DTO structure', { tag: '@sanity' }, async ({ api }) => {
      await api.users.modifyUser({
        id: user.id!,
        alertRegionUid: AlertRegions.KYIV_OBLAST.uid,
      } as any);
      await api.alertsMock.startAlert(AlertRegions.KYIV_OBLAST);
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

    test('[ALT-014] Check consistency with /active', { tag: '@sanity' }, async ({ api }) => {
      await api.users.modifyUser({
        id: user.id!,
        alertRegionUid: AlertRegions.KYIV_OBLAST.uid,
      } as any);

      await api.alertsMock.startAlert(AlertRegions.LVIV_OBLAST);
      await api.alerts.triggerSync();

      const activeAlerts = await api.alerts.getActiveAlerts();
      expect(activeAlerts.data).toContain(AlertRegions.LVIV_OBLAST.uid);

      const statusRes = await api.alerts.getMyAlertStatus();
      expect(statusRes.data.active).toBe(false);
      expect(statusRes.data.userAlertRegionUid).toBe(AlertRegions.KYIV_OBLAST.uid);
    });

    test('[ALT-015] Get status of alerts without authorization', { tag: '@sanity' }, async ({ api }) => {
      api.alerts.clearTokens();

      const getAlerts = await api.alerts.getMyAlertStatus();
      expect(getAlerts.response.status()).toBe(401);
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

    test(
      '[ALT-E2E-001] Sync -> Active: verify active alerts update after sync',
      { tag: '@sanity' },
      async ({ api }) => {
        let activeAlerts = await api.alerts.getActiveAlerts();
        expect(activeAlerts.data).toEqual([]);

        await api.alertsMock.startAlert(AlertRegions.KYIV_OBLAST);
        await api.alerts.triggerSync();

        activeAlerts = await api.alerts.getActiveAlerts();
        expect(activeAlerts.data).toContain(AlertRegions.KYIV_OBLAST.uid);
        expect(activeAlerts.data.length).toBe(1);
      },
    );

    test(
      '[ALT-E2E-002] Sync -> Status: user status corresponds to new mocked data',
      { tag: '@sanity' },
      async ({ api }) => {
        await api.users.modifyUser({ id: user.id!, alertRegionUid: AlertRegions.KYIV_OBLAST.uid } as any);

        await api.alertsMock.startAlert(AlertRegions.KYIV_OBLAST);
        await api.alerts.triggerSync();

        const statusRes = await api.alerts.getMyAlertStatus();
        expect(statusRes.data.active).toBe(true);
        expect(statusRes.data.userAlertRegionUid).toBe(AlertRegions.KYIV_OBLAST.uid);
      },
    );

    test('[ALT-E2E-003] Active <-> Status consistency', { tag: '@sanity' }, async ({ api }) => {
      await api.users.modifyUser({ id: user.id!, alertRegionUid: AlertRegions.KYIV_OBLAST.uid } as any);

      await api.alertsMock.startAlert(AlertRegions.KYIV_OBLAST);
      await api.alertsMock.startAlert(AlertRegions.LVIV_OBLAST);
      await api.alerts.triggerSync();

      const activeAlertsRes = await api.alerts.getActiveAlerts();
      const statusRes = await api.alerts.getMyAlertStatus();

      const activeUids = activeAlertsRes.data;
      const userUid = statusRes.data.userAlertRegionUid;

      if (userUid && activeUids.includes(userUid)) {
        expect(statusRes.data.active).toBe(true);
      } else {
        expect(statusRes.data.active).toBe(false);
      }

      expect(activeUids).toContain(AlertRegions.KYIV_OBLAST.uid);
      expect(activeUids).toContain(AlertRegions.LVIV_OBLAST.uid);
      expect(statusRes.data.active).toBe(true);
    });

    test.fixme(
      '[ALT-E2E-004] Coordinates -> Alert matches user physical coordinates',
      { tag: '@sanity' },
      async ({ api }) => {
        await api.users.modifyUser({
          id: user.id!,
          latitude: RegionCoordinates.LVIV.latitude,
          longitude: RegionCoordinates.LVIV.longitude,
        } as any);

        await api.alertsMock.startAlert(AlertRegions.LVIV_OBLAST);
        await api.alerts.triggerSync();

        const statusRes = await api.alerts.getMyAlertStatus();

        expect(statusRes.data.active).toBe(true);
        expect(statusRes.data.userAlertRegionUid).toBe(AlertRegions.LVIV_OBLAST.uid);
      },
    );

    [
      {
        testName: '[ALT-E2E-005] Air alert automatically degrades user safety status',
        status: 'SAFE',
        tag: '@sanity',
      },
      {
        testName: '[ALT-E2E-006] Air alert does not override existing DANGER status',
        status: 'DANGER',
        tag: '@sanity',
      },
      {
        testName: '[ALT-E2E-007] Air alert does not override existing UNKNOWN status',
        status: 'UNKNOWN',
        tag: '@sanity',
      },
    ].forEach((options) =>
      test.fixme(
        options.testName,
        {
          tag: options.tag,
        },
        async ({ api }) => {
          await api.users.modifyUser({ id: user.id!, alertRegionUid: AlertRegions.KYIV_OBLAST.uid } as any);
          await api.users.updateUserStatus({ status: options.status as any });

          await api.alertsMock.startAlert(AlertRegions.KYIV_OBLAST);
          await api.alerts.triggerSync();

          const userProfile = await api.users.getUser(user.id!);
          if (options.status == 'SAFE') expect(userProfile.data.status).toBe('WAS_SAFE');
          else expect(userProfile.data.status).toBe(options.status);
        },
      ),
    );

    test('[ALT-E2E-008] Status updates correctly when alert stops', { tag: '@sanity' }, async ({ api }) => {
      await api.users.modifyUser({ id: user.id!, alertRegionUid: AlertRegions.KYIV_OBLAST.uid } as any);

      await api.alertsMock.startAlert(AlertRegions.KYIV_OBLAST);
      await api.alerts.triggerSync();

      let statusRes = await api.alerts.getMyAlertStatus();
      expect(statusRes.data.active).toBe(true);

      await api.alertsMock.stopAlert(AlertRegions.KYIV_OBLAST);
      await api.alerts.triggerSync();

      statusRes = await api.alerts.getMyAlertStatus();
      expect(statusRes.data.active).toBe(false);
    });
  });
});
