import { expect, test } from '../../fixtures/api-fixture';

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
