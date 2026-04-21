import { expect, test } from '../../fixtures/api-fixture';

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
