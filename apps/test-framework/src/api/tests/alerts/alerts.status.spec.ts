import { UserEntity } from '@core/types/entites/user-interface';
import { AlertRegions } from '../../../core/data/regions';
import { expect, test } from '../../fixtures/api-fixture';

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
