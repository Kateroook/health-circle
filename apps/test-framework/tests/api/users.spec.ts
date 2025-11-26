import { expect, test } from '@playwright/test';
import { config } from '../../config';

test.describe('Users API Tests', () => {
  
  test('Створення користувача (без завершення реєстрації)', async ({ request }) => {
    const response = await request.post(`${config.baseURL}/api/users`, {
      data: {
        email: config.tempUser.email,
        phone: config.tempUser.phone,
        firstName: config.tempUser.firstName,
        middleName: config.tempUser.middleName,
        lastName: config.tempUser.lastName
      }
    });
    
    expect(response.status()).toBe(201);
    const user = await response.json();
    
    expect(user).toHaveProperty('id');
    expect(user.email).toBe(config.tempUser.email);
    expect(user.firstName).toBe(config.tempUser.firstName);
    expect(user.lastName).toBe(config.tempUser.lastName);
    
    // Зберігаємо ID для можливого cleanup (якщо буде потрібно)
    console.log('Created temp user ID:', user.id);
  });

  test('Створення користувача з невалідним email', async ({ request }) => {
    const response = await request.post(`${config.baseURL}/api/users`, {
      data: {
        email: 'invalid-email',
        phone: '+380501234567',
        firstName: 'Тест',
        middleName: 'Тестович',
        lastName: 'Тестовий'
      }
    });
    
    expect([400, 422]).toContain(response.status());
  });

  test('Створення користувача з невалідним телефоном', async ({ request }) => {
    const response = await request.post(`${config.baseURL}/api/users`, {
      data: {
        email: `test${Date.now()}@example.com`,
        phone: 'invalid-phone',
        firstName: 'Тест',
        middleName: 'Тестович',
        lastName: 'Тестовий'
      }
    });
    
    expect([400, 422]).toContain(response.status());
  });

  test('Створення користувача з дублюючим email', async ({ request }) => {
    const testEmail = `duplicate${Date.now()}@example.com`;
    
    // Перше створення
    await request.post(`${config.baseURL}/api/users`, {
      data: {
        email: testEmail,
        phone: '+380501234567',
        firstName: 'Тест',
        middleName: 'Тестович',
        lastName: 'Тестовий'
      }
    });
    
    // Друге створення з тим же email
    const response = await request.post(`${config.baseURL}/api/users`, {
      data: {
        email: testEmail,
        phone: '+380501234568',
        firstName: 'Тест2',
        middleName: 'Тестович2',
        lastName: 'Тестовий2'
      }
    });
    
    expect([400, 409, 422]).toContain(response.status());
  });

  test('Отримання користувача за ID з невалідним UUID', async ({ request }) => {
    const response = await request.get(`${config.baseURL}/api/users/invalid-uuid`, {
      headers: {
        'Authorization': `Bearer fake-token`
      }
    });
    
    expect([400, 401, 404]).toContain(response.status());
  });

  test('Отримання користувача за неіснуючим ID', async ({ request }) => {
    const fakeUUID = '00000000-0000-0000-0000-000000000000';
    
    const response = await request.get(`${config.baseURL}/api/users/${fakeUUID}`, {
      headers: {
        'Authorization': `Bearer fake-token`
      }
    });
    
    expect([401, 404]).toContain(response.status());
  });
});