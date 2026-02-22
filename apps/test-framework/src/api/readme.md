# API Test Framework (Refactored)

Структурована система для тестування API з типізацією, пласкою архітектурою та ізольованими контекстами.

## 🎯 Ключові зміни після рефакторингу

### ✅ Що було покращено:

1. **Єдиний API замість Dual**: Всі методи повертають `{ data: T, response: APIResponse }`
2. **Пласка структура**: Замість `.byId().avatar()` → `.getUserAvatar(id)`
3. **Вбудовані можливості Playwright**: Використання стандартних `params`, `headers`, `data`
4. **Безпечний парсинг JSON**: Автоматична перевірка `response.ok()` перед парсингом
5. **Ізоляція контексту**: Кожна фабрика має свій незалежний `TestContext`

## 📁 Структура проекту

```
src/
├── api/
│   ├── helpers/
│   │   └── config.ts                    # Конфігурація
│   └── tests/
│       └── examples-refactored.spec.ts  # Нові приклади
│
├── core/
│   ├── api/
│   │   ├── clients/
│   │   │   ├── base-client.ts           # BaseClient з ApiResult<T>
│   │   │   ├── auth-client.ts           # Пласкі методи Auth
│   │   │   ├── user-client.ts           # Пласкі методи Users
│   │   │   ├── group-client.ts          # Пласкі методи Groups
│   │   │   ├── contact-client.ts        # Пласкі методи Contacts
│   │   │   ├── api-client-factory.ts    # Фабрика з ізоляцією
│   │   │   └── index.ts
│   │   ├── helpers/
│   │   │   ├── response-checker.ts      # Перевірка статус-кодів
│   │   │   ├── test-context.ts          # TestContext
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── types/
│       └── api/
│           ├── common.types.ts
│           ├── auth.types.ts
│           ├── users.types.ts
│           ├── groups.types.ts
│           ├── contacts.types.ts
│           └── index.ts
```

## 🚀 Швидкий старт

### Базове використання

```typescript
import { test, expect } from '@playwright/test';
import { createApiClients } from '../../core/api';
import { checkResponse } from '../../core/api/helpers/response-checker';
import { config } from '../helpers/config';

test('Basic test', async ({ request }) => {
  const api = createApiClients(request);

  // Метод повертає { data, response }
  const result = await api.auth().login({
    email: config.testUser.email,
    password: config.testUser.password,
  });
  
  // Доступ до даних
  console.log(result.data);
  
  // Доступ до response
  await checkResponse.is200(result.response);
});
```

## 🏗️ ApiResult Structure

Всі методи API повертають об'єкт `ApiResult<T>`:

```typescript
interface ApiResult<T> {
  data: T;           // Розпарсені дані (null якщо помилка)
  response: APIResponse;  // Playwright response для детальних перевірок
}
```

### Приклади використання:

```typescript
// Доступ до обох полів
const result = await api.users().getUser(id);
console.log(result.data);
expect(result.response.status()).toBe(200);

// Деструктуризація - тільки дані
const { data } = await api.auth().getProfile();
console.log(data?.email);

// Деструктуризація - тільки response
const { response } = await api.users().updateUserStatus({ status: 'SAFE' });
await checkResponse.is200(response);

// Обробка помилок
const result = await api.users().getUser('invalid-id');
if (result.response.ok()) {
  console.log('User:', result.data);
} else {
  console.log('Error:', result.response.status());
  // result.data буде null для помилок
}
```

## 📝 Пласка структура методів

### Було (Nested):
```typescript
api.users().byId(id).get()
api.users().byId(id).avatar.get()
api.groups().byId(id).blockedUsers.user(userId).block()
```

### Стало (Flat):
```typescript
api.users().getUser(id)
api.users().getUserAvatar(id)
api.groups().blockUser(groupId, userId)
```

## 🎯 Повний список методів

### AuthClient

```typescript
// Основні методи
await api.auth().login(data)              // POST /api/auth/login
await api.auth().logout()                 // POST /api/auth/logout
await api.auth().refreshToken()           // POST /api/auth/refresh
await api.auth().getProfile()             // GET /api/auth/profile

// Робота з паролями
await api.auth().setupPassword(email, code, body)     // POST /api/auth/password-setup
await api.auth().changePassword(data)                 // POST /api/auth/change-password
await api.auth().forgotPassword(data)                 // POST /api/auth/forgot-password
await api.auth().resetPassword(email, code, body)     // POST /api/auth/reset-password
await api.auth().resendRegistrationCode()             // POST /api/auth/resend-registration-code

// Хелпери
await api.auth().quickLogin(email, password)          // Login + save userId
```

### UserClient

```typescript
// CRUD операції
await api.users().getUser(id)                         // GET /api/users/{id}
await api.users().createUser(data)                    // POST /api/users
await api.users().modifyUser(data)                    // PUT /api/users
await api.users().deleteUser()                        // DELETE /api/users

// Аватари
await api.users().getUserAvatar(id)                   // GET /api/users/{id}/avatar
await api.users().uploadUserAvatar(id, file)          // PUT /api/users/{id}/avatar
await api.users().deleteUserAvatar(id)                // DELETE /api/users/{id}/avatar

// Інші операції
await api.users().updateUserStatus(data)              // PUT /api/users/status
await api.users().saveFcmToken(token)                 // PUT /api/users/fcm-token
await api.users().resetUserPassword(id)               // PATCH /api/users/{id}/reset-password
```

### GroupClient

```typescript
// CRUD операції
await api.groups().getAllGroups()                     // GET /api/groups
await api.groups().getGroup(id)                       // GET /api/groups/{id}
await api.groups().createGroup(data)                  // POST /api/groups
await api.groups().updateGroup(data)                  // PUT /api/groups
await api.groups().deleteGroup(id)                    // DELETE /api/groups/{id}

// Membership
await api.groups().leaveGroup(id)                     // POST /api/groups/{id}/leave
await api.groups().joinGroup(data)                    // POST /api/groups/join

// Запрошення
await api.groups().regenerateInviteCode(id)           // POST /api/groups/{id}/invite

// Блокування
await api.groups().getBlockedUsers(id)                // GET /api/groups/{id}/blocked-users
await api.groups().blockUser(groupId, userId)         // POST /api/groups/{id}/block/{userId}
await api.groups().unblockUser(groupId, userId)       // DELETE /api/groups/{id}/block/{userId}
```

### ContactClient

```typescript
// CRUD операції
await api.contacts().getAllContacts()                 // GET /api/contacts
await api.contacts().createContact(data)              // POST /api/contacts
await api.contacts().updateContact(targetId, body)    // PATCH /api/contacts/{targetId}
await api.contacts().deleteContact(targetId)          // DELETE /api/contacts/{targetId}
await api.contacts().setContactAlias(targetId, body)  // PUT /api/contacts/{targetId}

// Хелпери
await api.contacts().findContactByTargetId(targetId)
await api.contacts().contactExists(targetId)
```

## 🔒 Ізоляція TestContext

Кожна фабрика має свій незалежний контекст:

```typescript
// Створюємо два окремі клієнти
const user1Api = createApiClients(request);
const user2Api = createApiClients(request);

await user1Api.auth().login({ email: 'user1@test.com', password: 'pass1' });
await user2Api.auth().login({ email: 'user2@test.com', password: 'pass2' });

// Контексти ізольовані
expect(user1Api.getContext().accessToken).not.toBe(
  user2Api.getContext().accessToken
);

// Кожен клієнт використовує свій токен
await user1Api.users().getUser('id1');  // Використовує токен user1
await user2Api.users().getUser('id2');  // Використовує токен user2
```

### Клонування фабрики

```typescript
const originalApi = createApiClients(request);
await originalApi.auth().login({ email, password });

// Клонування без контексту (новий порожній)
const cleanClone = originalApi.clone();
expect(cleanClone.getContext().accessToken).toBeUndefined();

// Клонування з контекстом (копія стану)
const cloneWithContext = originalApi.cloneWithContext();
expect(cloneWithContext.getContext().accessToken).toBe(
  originalApi.getContext().accessToken
);

// Зміни в клоні не впливають на оригінал
cloneWithContext.auth().clearTokens();
expect(originalApi.getContext().accessToken).toBeDefined();
```

## 🛡️ Безпечний парсинг JSON

BaseClient автоматично обробляє помилки:

```typescript
// При помилці 4xx/5xx data буде null
const result = await api.users().getUser('invalid-id');

if (result.response.ok()) {
  console.log('User:', result.data);  // Типізовані дані
} else {
  console.log('Error:', result.response.status());
  expect(result.data).toBeNull();  // null для помилок
}
```

## 🔧 Response Checker

Зручні хелпери для перевірки статус-кодів:

```typescript
import { checkResponse } from '../../core/api/helpers/response-checker';

const { response } = await api.auth().login({ email, password });

// Перевірка успішних відповідей
await checkResponse.is2xx(response);  // Будь-який 2xx
await checkResponse.is200(response);  // 200 OK
await checkResponse.is201(response);  // 201 Created

// Перевірка помилок
await checkResponse.is4xx(response);  // Будь-який 4xx
await checkResponse.is401(response);  // 401 Unauthorized
await checkResponse.is404(response);  // 404 Not Found
```

## 🎓 Best Practices

1. ✅ Використовуйте `createApiClients()` для кожного користувача окремо
2. ✅ Використовуйте деструктуризацію `{ data, response }` де потрібно
3. ✅ Перевіряйте `response.ok()` перед використанням `data`
4. ✅ Використовуйте `checkResponse` для явних перевірок статус-кодів
5. ✅ Клонуйте фабрику для ізоляції між тестами
6. ✅ Перевіряйте `data` на `null` при обробці помилок

## 🧪 Приклади тестів

### Простий тест

```typescript
test('User can login', async ({ request }) => {
  const api = createApiClients(request);
  
  const { data, response } = await api.auth().login({
    email: config.testUser.email,
    password: config.testUser.password,
  });
  
  await checkResponse.is200(response);
  expect(data).toBeDefined();
  expect(api.getContext().accessToken).toBeDefined();
});
```

### Тест з обробкою помилок

```typescript
test('Handle 404 error', async ({ request }) => {
  const api = createApiClients(request);
  
  await api.auth().quickLogin(email, password);
  
  const result = await api.users().getUser('non-existent-id');
  
  await checkResponse.is404(result.response);
  expect(result.data).toBeNull();
});
```

### Тест з декількома користувачами

```typescript
test('Multiple users interaction', async ({ request }) => {
  const user1Api = createApiClients(request);
  const user2Api = createApiClients(request);
  
  // Логін користувачів
  await user1Api.auth().login({ email: 'user1@test.com', password: 'pass1' });
  await user2Api.auth().login({ email: 'user2@test.com', password: 'pass2' });
  
  // Створення групи user1
  const { data: group } = await user1Api.groups().createGroup({ name: 'Test' });
  
  // user2 приєднується до групи
  const { data: invite } = await user1Api.groups().regenerateInviteCode(group!.id);
  await user2Api.groups().joinGroup({ code: invite!.inviteCode });
  
  // Перевірка
  const { data: groups } = await user2Api.groups().getAllGroups();
  expect(groups).toContainEqual(expect.objectContaining({ id: group!.id }));
});
```

## 🔑 Конфігурація

Створіть `.env` файл:

```env
API_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

## 📄 Ліцензія

MIT