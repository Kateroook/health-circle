import { expect, test } from '@playwright/test';
import { config, extractTokenFromCookies, TestContext } from '../../config';
import { login } from '../../helpers/api-helper';

let testContext: TestContext = {};

test.describe('Auth API Tests', () => {
  
  test('Успішний логін існуючого користувача', async ({ request }) => {
    const response = await request.post(`${config.baseURL}/api/auth/login`, {
      data: {
        email: config.testUser.email,
        password: config.testUser.password
      }
    });
    
    expect(response.status()).toBe(201);
    
    const cookies = response.headers()['set-cookie'];
    if (cookies) {
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      testContext.accessToken = extractTokenFromCookies(cookieArray, 'access_token');
      testContext.refreshToken = extractTokenFromCookies(cookieArray, 'refresh_token');
    }
    
    const data = await response.json();
    expect(data).toHaveProperty('redirectUrl');
  });

  test('Логін з неправильним email', async ({ request }) => {
    const response = await request.post(`${config.baseURL}/api/auth/login`, {
      data: {
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!'
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('Логін з неправильним паролем', async ({ request }) => {
    const response = await request.post(`${config.baseURL}/api/auth/login`, {
      data: {
        email: config.testUser.email,
        password: 'WrongPassword123!'
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('Логін з невалідним форматом email', async ({ request }) => {
    const response = await request.post(`${config.baseURL}/api/auth/login`, {
      data: {
        email: 'invalid-email-format',
        password: 'TestPassword123!'
      }
    });
    
    expect([400, 401]).toContain(response.status());
  });

  test.only('Отримання профілю авторизованого користувача', async ({ request }) => {
    const accessToken = await login(request);
    
    const response = await request.get(`${config.baseURL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
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
    const response = await request.get(`${config.baseURL}/api/auth/profile`, {
      headers: {
        'Authorization': 'Bearer invalid-token-xyz'
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('Logout авторизованого користувача', async ({ request }) => {
    // Логінимось
    const loginResponse = await request.post(`${config.baseURL}/api/auth/login`, {
      data: {
        email: config.testUser.email,
        password: config.testUser.password
      }
    });
    
    const cookies = loginResponse.headers()['set-cookie'];
    const accessToken = cookies 
      ? extractTokenFromCookies(Array.isArray(cookies) ? cookies : [cookies], 'access_token')
      : '';
    
    // Logout
    const response = await request.post(`${config.baseURL}/api/auth/logout`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    expect(response.status()).toBe(200);
  });

  test('Logout без токена (негативний)', async ({ request }) => {
    const response = await request.post(`${config.baseURL}/api/auth/logout`);
    
    expect(response.status()).toBe(401);
  });
});