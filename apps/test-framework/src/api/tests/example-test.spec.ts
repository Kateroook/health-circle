import { test, expect } from '@playwright/test';
import { createApiClients } from '../../core/api/api-client-factory';
import { assertResponse } from '../../core/api/helpers/response-checker';
import { config } from '../helpers/config';

test.describe.skip('Refactored API Clients Usage Examples', () => {
  test.skip('Example 1: Basic usage with flat structure', async ({ request }) => {
    // Створюємо фабрику клієнтів з ізольованим контекстом
    const api = createApiClients(request);

    // ============ Auth ============
    // Логін користувача - повертає { data, response }
    const loginResult = await api.auth.login({
      email: config.testUser.email,
      password: config.testUser.password,
    });

    // Перевіряємо відповідь
    assertResponse.is201(loginResult.response);
    console.log('Login Data:', loginResult.data);

    // Токени автоматично збережені в контексті
    console.log('Access Token:', api.getContext().accessToken);

    // ============ Profile ============
    // Отримуємо профіль (використовується збережений токен)
    const profileResult = await api.auth.getProfile();
    assertResponse.is200(profileResult.response);
    console.log('User Profile:', profileResult.data);

    // ============ Users ============
    // Отримуємо користувача за ID - плаский метод
    const userResult = await api.users.getUser(profileResult.data!.id);
    assertResponse.is200(userResult.response);

    // Оновлюємо статус користувача
    const statusResult = await api.users.updateUserStatus({ status: 'SAFE' });
    assertResponse.is200(statusResult.response);

    // ============ Groups ============
    // Створюємо групу
    const createGroupResult = await api.groups.createGroup({
      name: 'Test Group',
    });
    assertResponse.is201(createGroupResult.response);
    console.log('Created Group:', createGroupResult.data);

    // Отримуємо всі групи
    const groupsResult = await api.groups.getAllGroups();
    assertResponse.is200(groupsResult.response);
    console.log('All Groups:', groupsResult.data);

    // Згенеруємо новий код запрошення
    const inviteResult = await api.groups.regenerateInviteCode(createGroupResult.data!.id);
    assertResponse.is201(inviteResult.response);
    console.log('Invite Code:', inviteResult.data);

    // ============ Logout ============
    const logoutResult = await api.auth.logout();
    assertResponse.is201(logoutResult.response);

    // Токени автоматично очищені
    expect(api.getContext().accessToken).toBeUndefined();
  });

  test.skip('Example 2: Working with ApiResult structure', async ({ request }) => {
    const api = createApiClients(request);

    // Метод повертає ApiResult<T>
    const result = await api.auth.quickLogin(config.testUser.email, config.testUser.password);

    // Доступ до даних
    console.log('Data:', result.data);

    // Доступ до response для детальної перевірки
    expect(result.response.ok()).toBeTruthy();
    expect(result.response.status()).toBe(201);

    // Якщо потрібні тільки дані
    const { data } = await api.auth.getProfile();
    expect(data?.email).toBe(config.testUser.email);

    // Якщо потрібні тільки response
    const { response } = await api.users.updateUserStatus({ status: 'SAFE' });
    assertResponse.is200(response);
  });

  test.skip('Example 3: Flat structure methods', async ({ request }) => {
    const api = createApiClients(request);

    await api.auth.quickLogin(config.testUser.email, config.testUser.password);
    const profile = await api.auth.getProfile();

    // ============ Пласкі методи для User ============
    // Замість: users.byId(id).get()
    await api.users.getUser(profile.data!.id);

    // Замість: users.byId(id).avatar.get()
    await api.users.getUserAvatar(profile.data!.id);

    // Замість: users.byId(id).avatar.delete()
    await api.users.deleteUserAvatar(profile.data!.id);

    // Замість: users.byId(id).resetPassword()
    await api.users.resetUserPassword(profile.data!.id);

    // Замість: users.status.update()
    await api.users.updateUserStatus({ status: 'SAFE' });

    // Замість: users.fcmToken.save()
    await api.users.saveFcmToken('token-value');

    // ============ Пласкі методи для groups ============
    const group = await api.groups.createGroup({ name: 'Flat Test' });

    // Замість: group.byId(id).get()
    await api.groups.getGroup(group.data!.id);

    // Замість: group.byId(id).leave()
    await api.groups.leaveGroup(group.data!.id);

    // Замість: group.byId(id).invite.regenerate()
    await api.groups.regenerateInviteCode(group.data!.id);

    // Замість: group.byId(id).blockedUsers.get()
    await api.groups.getBlockedUsers(group.data!.id);

    // Замість: groups.byId(id).blockedUsers.user(userId).block()
    await api.groups.blockUser(group.data!.id, 'some-user-id');

    // Замість: groups.byId(id).blockedUsers.user(userId).unblock()
    await api.groups.unblockUser(group.data!.id, 'some-user-id');

    // ============ Пласкі методи для Contact ============
    // Замість: contacts().byTargetId(targetId).update()
    await api.contacts.updateContact('target-id', { alias: 'New Alias' });

    // Замість: contacts().byTargetId(targetId).setAlias()
    await api.contacts.setContactAlias('target-id', { alias: 'Updated' });

    // Замість: contacts().byTargetId(targetId).delete()
    await api.contacts.deleteContact('target-id');
  });

  test.skip('Example 4: Error handling with safe JSON parsing', async ({ request }) => {
    const api = createApiClients(request);

    // Тест на помилку 401 (не авторизований)
    const unauthorizedResult = await api.auth.getProfile();
    assertResponse.is401(unauthorizedResult.response);
    // data буде null для некоректних відповідей
    expect(unauthorizedResult.data).toBeNull();

    // Логін з неправильними даними
    const failedLoginResult = await api.auth.login({
      email: 'wrong@email.com',
      password: 'wrongpassword',
    });
    assertResponse.is401(failedLoginResult.response);
    expect(failedLoginResult.data).toBeNull();

    // Тест на помилку 404 (не знайдено)
    await api.auth.quickLogin(config.testUser.email, config.testUser.password);

    const notFoundResult = await api.users.getUser('non-existent-id');
    assertResponse.is401(notFoundResult.response);
    expect(notFoundResult.data).toBeNull();
  });

  test.skip('Example 5: Isolated contexts for multiple users', async ({ request }) => {
    // Створюємо два окремі клієнти з ізольованими контекстами
    const user1Api = createApiClients(request);
    const user2Api = createApiClients(request);

    // Логін першого користувача
    await user1Api.auth.quickLogin(config.testUser.email, config.testUser.password);

    // Логін другого користувача (припустимо, маємо другі credentials)
    // await user2Api.auth.quickLogin('user2@test.com', 'password2');

    // Контексти повністю ізольовані
    expect(user1Api.getContext().accessToken).toBeDefined();
    expect(user1Api.getContext().accessToken).not.toBe(user2Api.getContext().accessToken);

    // Кожен клієнт використовує свій токен
    const user1Profile = await user1Api.auth.getProfile();
    // const user2Profile = await user2Api.auth.getProfile();

    // Токени не перетинаються
    console.log('User1 Context:', user1Api.getContext());
    console.log('User2 Context:', user2Api.getContext());
  });

  test.skip('Example 6: Cloning factory for test isolation', async ({ request }) => {
    const originalApi = createApiClients(request);

    await originalApi.auth.quickLogin(config.testUser.email, config.testUser.password);

    // Клонуємо без контексту - новий порожній контекст
    const cleanClone = originalApi.clone();
    expect(cleanClone.getContext().accessToken).toBeUndefined();

    // Клонуємо з контекстом - копія поточного стану
    const cloneWithContext = originalApi.cloneWithContext();
    expect(cloneWithContext.getContext().accessToken).toBe(originalApi.getContext().accessToken);

    // Але це все одно незалежні об'єкти
    cloneWithContext.auth.clearTokens();
    expect(cloneWithContext.getContext().accessToken).toBeUndefined();
    expect(originalApi.getContext().accessToken).toBeDefined();
  });

  test.skip('Example 7: Password management with flat methods', async ({ request }) => {
    const api = createApiClients(request);
    const newPassword = 'NewPassword123!';

    // Запит на скидання пароля
    const forgotResult = await api.auth.forgotPassword({
      email: config.testUser.email,
    });
    assertResponse.is201(forgotResult.response);

    // Встановлення пароля (потрібен email і code)
    await api.auth.setupPassword('user@example.com', 'verification-code', {
      newPassword: 'NewPassword123!',
      confirmNewPassword: 'NewPassword123!',
    });

    // Зміна пароля (для авторизованого користувача)
    await api.auth.quickLogin(config.testUser.email, config.testUser.password);

    const changeResult = await api.auth.changePassword({
      oldPassword: config.testUser.password,
      newPassword: newPassword,
      confirmNewPassword: newPassword,
    });
    assertResponse.is201(changeResult.response);

    const cleanupResult = await api.auth.changePassword({
      oldPassword: newPassword,
      newPassword: config.testUser.password,
      confirmNewPassword: config.testUser.password,
    });
    assertResponse.is201(cleanupResult.response);
  });

  test.skip('Example 8: Using built-in Playwright params', async ({ request }) => {
    const api = createApiClients(request);

    await api.auth.quickLogin(config.testUser.email, config.testUser.password);

    // Playwright автоматично обробляє params
    // BaseClient передає params напряму в request.get()
    const result = await api.auth.setupPassword('user@test.com', 'code123', {
      newPassword: 'NewPass123!',
      confirmNewPassword: 'NewPass123!',
    });

    // URL буде: /api/auth/password-setup?email=user@test.com&code=code123
    // Playwright сам формує query string
  });
});
