import { UserEntity } from '@core/types/entites/user-interface';
import { expect, test } from '../../fixtures/api-fixture';

test.describe.serial('E2E: Alerts Flow', { tag: ['@alerts', '@e2e'] }, async () => {
  let user: UserEntity;

  test.beforeEach(async ({ api, spawnUser }) => {
    user = await spawnUser();
    await api.auth.quickLogin(user.email, user.password);

    await api.alertsMock.resetAll();
    await api.alerts.triggerSync();
  });

  test('[ALT-E2E-001] Sync -> Active: verify active alerts update after sync', { tag: '@sanity' }, async ({ api }) => {
    let activeAlerts = await api.alerts.getActiveAlerts();
    expect(activeAlerts.data).toEqual([]);

    await api.alertsMock.startAlert({ uid: 14, title: 'Київська область' } as any);
    await api.alerts.triggerSync();

    activeAlerts = await api.alerts.getActiveAlerts();
    expect(activeAlerts.data).toContain(14);
    expect(activeAlerts.data.length).toBe(1);
  });

  test('[ALT-E2E-002] Sync -> Status: user status corresponds to new mocked data', async ({ api }) => {
    await api.users.modifyUser({ id: user.id!, alertRegionUid: 14 } as any);

    await api.alertsMock.startAlert({ uid: 14, title: 'Київська область' } as any);
    await api.alerts.triggerSync();

    const statusRes = await api.alerts.getMyAlertStatus();
    expect(statusRes.data.active).toBe(true);
    expect(statusRes.data.userAlertRegionUid).toBe(14);
  });

  test('[ALT-E2E-003] Active <-> Status consistency', async ({ api }) => {
    await api.users.modifyUser({ id: user.id!, alertRegionUid: 14 } as any);

    await api.alertsMock.startAlert({ uid: 14, title: 'Київська область' } as any);
    await api.alertsMock.startAlert({ uid: 27, title: 'Львівська область' } as any);
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

    expect(activeUids).toContain(14);
    expect(activeUids).toContain(27);
    expect(statusRes.data.active).toBe(true);
  });
});
