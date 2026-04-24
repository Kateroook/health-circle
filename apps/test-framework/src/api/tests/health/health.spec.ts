import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  '/api/health tests',
  {
    tag: ['@health', '@smoke'],
  },
  async () => {
    test('[HLT-001] GET /api/health — service is available', async ({ api }) => {
      const healthResult = await api.health.getHealth();

      expect(healthResult.response).toHaveStatus(200);
      expect(healthResult.data.status).toBe('ok');
      expect(healthResult.data.info.database.status).toBe('up');
    });

    test('[HLT-002] Response matches the schema', async ({ api }) => {
      const healthResult = await api.health.getHealth();

      expect(healthResult.response).toHaveStatus(200);
      expect(healthResult.data).toHaveProperty('status');
      expect(healthResult.data).toHaveProperty('info');
      expect(healthResult.data).toHaveProperty('details');
    });
  },
);
