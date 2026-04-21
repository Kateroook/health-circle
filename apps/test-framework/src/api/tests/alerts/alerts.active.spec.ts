import { expect, test } from '../../fixtures/api-fixture';

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
    await api.alertsMock.startAlert({ uid: 14, title: 'Київська область' });
    await api.alerts.triggerSync();

    const getAlerts = await api.alerts.getActiveAlerts();
    expect(getAlerts.response.status()).toBe(200);
    expect(getAlerts.data.length).toBe(1);
  });

  test('[ALT-003] Get list with few active alerts', { tag: '@sanity' }, async ({ api }) => {
    await api.alertsMock.startAlert({ uid: 14, title: 'Київська область' });
    await api.alertsMock.startAlert({ uid: 27, title: 'Львівська область' });
    await api.alertsMock.startAlert({ uid: 18, title: 'Одеська область' });
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
