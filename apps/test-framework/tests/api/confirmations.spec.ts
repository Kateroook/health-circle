import { test, expect } from '@playwright/test';
import { config } from '../../config';

test.describe('Confirmations API Tests', () => {
  
  test('Валідація коду з невалідним email', async ({ request }) => {
    const response = await request.get(
      `${config.baseURL}/api/confirmations/validate/password-setup`,
      {
        params: {
          email: 'nonexistent@example.com',
          code: 'some-code-123'
        }
      }
    );
    
    expect([400, 404]).toContain(response.status());
  });

  test('Валідація коду з невалідним форматом email', async ({ request }) => {
    const response = await request.get(
      `${config.baseURL}/api/confirmations/validate/password-setup`,
      {
        params: {
          email: 'invalid-email-format',
          code: 'some-code-123'
        }
      }
    );
    
    expect([400, 404, 422]).toContain(response.status());
  });

  test('Валідація коду без параметрів', async ({ request }) => {
    const response = await request.get(
      `${config.baseURL}/api/confirmations/validate/password-setup`
    );
    
    expect([400, 422]).toContain(response.status());
  });
});