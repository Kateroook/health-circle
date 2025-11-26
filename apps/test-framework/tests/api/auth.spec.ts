import { expect, test } from '@playwright/test';
import { config, TestContext } from '../../config';
import { authWithAccessToken, getAccessToken, login } from '../../helpers/api-helper';
import { LoginResponse } from '../../types/api-types';

let testContext: TestContext = {};

test.describe('Auth API Tests', () => {
  
  test('Успішний логін існуючого користувача', async ({ request }) => {
    const response = await login({ request: request });
    const loginBody : LoginResponse = await response.json();
    
    expect(response.status()).toBe(201);
    if (loginBody) {
      testContext.accessToken = loginBody.accessToken;
      testContext.refreshToken = loginBody.refreshToken;
    }
    
    expect(loginBody).toHaveProperty('accessToken');
    expect(loginBody).toHaveProperty('refreshToken');
  });

  test('Логін з неправильним email', async ({ request }) => {
    const response = await login({
        request: request,
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!'
      });
    
    expect(response.status()).toBe(401);
  });

  test('Логін з неправильним паролем', async ({ request }) => {
    const response = await login({
        request: request,
        email: config.testUser.email,
        password: 'WrongPassword123!'
    });
    
    expect(response.status()).toBe(401);
  });

  test('Логін з невалідним форматом email', async ({ request }) => {
    const response = await login({
        request: request,
        email: 'invalid-email-format',
        password: 'TestPassword123!'
      });
    
    expect([400, 401]).toContain(response.status());
  });

  test('Отримання профілю авторизованого користувача', async ({ request }) => {
    const accessToken = await getAccessToken({request: request});
    
    const response = await authWithAccessToken({ request: request, accessToken:accessToken });
    
    expect(response.status()).toBe(200);
    const profile = await response.json();
    
    expect(profile).toHaveProperty('id');
    expect(profile).toHaveProperty('email');
    expect(profile).toHaveProperty('firstName');
    expect(profile).toHaveProperty('lastName');
    expect(profile.email).toBe(config.testUser.email);
  });

  test('Отримання профілю без токена (негативний)', async ({ request }) => {
    const response = await request.get(`${config.baseURL}/api/auth/profile`);
    
    expect(response.status()).toBe(401);
  });

  test('Отримання профілю з невалідним токеном', async ({ request }) => {
    const response = await authWithAccessToken({ request: request, accessToken: 'invalid-token-xyz'});
    
    expect(response.status()).toBe(401);
  });

  test('Logout авторизованого користувача', async ({ request }) => {
    // Логінимось, щоб отримати токен
    const accessToken = await getAccessToken({request: request});
    
    // Logout
    const response = await request.post(`${config.baseURL}/api/auth/logout`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    expect(response.status()).toBe(201);
  });

  test('Logout без токена (негативний)', async ({ request }) => {
    const response = await request.post(`${config.baseURL}/api/auth/logout`);
    
    expect(response.status()).toBe(401);
  });
});