# Test Framework Documentation

A Playwright + TypeScript test automation framework for API testing, with planned extension to mobile and E2E testing via WebdriverIO.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Architecture](#architecture)
4. [Core Modules](#core-modules)
   - [API Clients](#api-clients)
   - [Database Layer](#database-layer)
   - [Data Builders & Factories](#data-builders--factories)
   - [Fixtures](#fixtures)
   - [Utilities](#utilities)
5. [Configuration](#configuration)
6. [Writing Tests](#writing-tests)
7. [Running Tests](#running-tests)
8. [Future Plans](#future-plans)

---

## Overview

This framework is built on top of **Playwright Test** with **TypeScript** and covers API-level testing for a mobile full-stack application. It includes a layered client architecture, direct database access for setup/teardown, typed data builders, and automatic post-test cleanup.

**Tech stack:**

- [Playwright Test](https://playwright.dev/) — test runner and HTTP client
- [Kysely](https://kysely.dev/) — type-safe SQL query builder
- [PostgreSQL](https://www.postgresql.org/) — application database
- [@faker-js/faker](https://fakerjs.dev/) — random test data generation
- [nanoid](https://github.com/ai/nanoid) — short unique ID generation
- [dotenv](https://github.com/motdotla/dotenv) — environment variable management

---

## Project Structure

```
test-framework/
├── .github/
│   └── workflows/
│       └── playwright.yml          # CI pipeline
├── src/
│   ├── api/                        # API test layer (tests live here)
│   │   ├── fixtures/
│   │   │   └── api-fixture.ts      # Playwright fixture definitions + custom expect
│   │   ├── helpers/                # (reserved for future helpers)
│   │   └── tests/
│   │       ├── auth/               # Auth endpoint test files
│   │       │   ├── auth.change-password.spec.ts
│   │       │   ├── auth.flow.spec.ts
│   │       │   ├── auth.forgot-password.spec.ts
│   │       │   ├── auth.login.spec.ts
│   │       │   ├── auth.logout.spec.ts
│   │       │   ├── auth.password-setup.spec.ts
│   │       │   ├── auth.profile.spec.ts
│   │       │   ├── auth.refresh.spec.ts
│   │       │   ├── auth.resend-reg-code.spec.ts
│   │       │   └── auth.reset-password.spec.ts
│   │       ├── contacts/           # Contact endpoint test files
│   │       ├── groups/             # Group endpoint test files
│   │       ├── users/              # User endpoint test files
│   │       └── test-plan.md        # Test coverage plan
│   ├── core/                       # Reusable framework internals
│   │   ├── api/
│   │   │   ├── clients/            # HTTP client implementations
│   │   │   │   ├── base-client.ts
│   │   │   │   ├── auth-client.ts
│   │   │   │   ├── user-client.ts
│   │   │   │   ├── group-client.ts
│   │   │   │   └── contact-client.ts
│   │   │   ├── helpers/
│   │   │   │   ├── response-checker.ts   # Custom expect matchers + checkResponse helpers
│   │   │   │   └── test-context.ts       # Auth token & user state container
│   │   │   └── api-client-factory.ts     # Entry point for API clients
│   │   ├── data/
│   │   │   ├── builders/           # Fluent object builders
│   │   │   │   ├── user-builder.ts
│   │   │   │   └── group-builder.ts
│   │   │   └── factories/          # High-level factory functions
│   │   │       ├── user-factory.ts
│   │   │       ├── group-factory.ts
│   │   │       └── contact-factory.ts
│   │   ├── db/
│   │   │   ├── repositories/       # DB access per entity
│   │   │   │   ├── base-repository.ts
│   │   │   │   ├── user-repository.ts
│   │   │   │   ├── group-repository.ts
│   │   │   │   ├── contact-repository.ts
│   │   │   │   └── confirmation-code-repository.ts
│   │   │   ├── db-cleaner.ts       # Post-test cleanup tracker
│   │   │   ├── db-manager.ts       # Singleton Kysely DB connection
│   │   │   └── schema.ts           # DB table-to-entity type map
│   │   └── types/
│   │       ├── api/                # Request/response TypeScript types
│   │       │   ├── auth.types.ts
│   │       │   ├── common.types.ts
│   │       │   ├── contacts.types.ts
│   │       │   ├── groups.types.ts
│   │       │   ├── index.ts
│   │       │   └── users.types.ts
│   │       ├── db/                 # DB entity types
│   │       │   ├── codes-and-files.ts
│   │       │   ├── groups-and-contacts.ts
│   │       │   └── user-entities.ts
│   │       └── entites/            # Domain entity interfaces
│   │           ├── contact-interface.ts
│   │           ├── group-interface.ts
│   │           └── user-interface.ts
│   ├── mobile/                     # Placeholder for future mobile tests
│   ├── scripts/
│   │   └── test-db.ts              # DB connection sanity-check script
│   └── utils/
│       ├── utils.ts                # Top-level Utils class (random, date)
│       ├── random-helper.ts        # Faker/nanoid wrappers
│       └── date-helper.ts          # Date utilities
├── .env                            # Local environment variables (not committed)
├── playwright.config.ts
└── package.json
```

---

## Architecture

The framework is organized in three clear layers:

```
┌──────────────────────────────────────────┐
│              Test Files (*.spec.ts)       │  ← You write tests here
├──────────────────────────────────────────┤
│       Fixtures (api-fixture.ts)           │  ← Dependency injection via Playwright
├──────────────────────────────────────────┤
│  ApiClientFactory  │  Repositories        │  ← Test interaction layer
│  (API clients)     │  (DB direct access)  │
├──────────────────────────────────────────┤
│  BaseClient        │  BaseRepository      │  ← Shared abstractions
├──────────────────────────────────────────┤
│         Kysely + PostgreSQL               │  ← Database
└──────────────────────────────────────────┘
```

**Key design principles:**

- **Isolation** — each test gets its own `TestContext`, so tokens and user state never leak between tests.
- **Automatic cleanup** — `DbCleaner` tracks created entities and deletes them after each test in LIFO order.
- **Typed everywhere** — all API requests and responses, DB entities, and domain objects are typed via TypeScript interfaces.
- **Single responsibility** — API clients only handle HTTP. Repositories only handle DB queries. Factories only generate data.

---

## Core Modules

### API Clients

All clients extend `BaseClient`, which handles:

- Constructing request URLs from `baseURL + endpoint`
- Injecting `Authorization: Bearer <token>` headers when a token is present in `TestContext`
- Safe JSON parsing (returns `null` on empty or failed responses)
- Typed `get`, `post`, `put`, `patch`, `delete` methods

**`ApiClientFactory`** is the single entry point. It holds a shared `TestContext` and exposes clients as getters:

```typescript
const api = new ApiClientFactory({ request, dbCleaner });

api.auth; // AuthClient
api.users; // UserClient
api.groups; // GroupClient
api.contacts; // ContactClient

api.getContext(); // access current TestContext (accessToken, refreshToken, userId)
api.clone(); // new factory with a fresh empty TestContext
api.cloneWithContext(); // new factory with a copy of the current TestContext
```

Because all clients share the same `TestContext` instance, logging in via `api.auth.login(...)` automatically makes the token available to all other clients.

**Available clients and their methods:**

`AuthClient` — `src/core/api/clients/auth-client.ts`

| Method                             | Endpoint                                  | Description                                                            |
| ---------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| `login(data)`                      | `POST /api/auth/login`                    | Login and auto-save tokens to `TestContext`                            |
| `logout()`                         | `POST /api/auth/logout`                   | Logout and clear tokens from `TestContext`                             |
| `refreshToken()`                   | `POST /api/auth/refresh`                  | Swap refresh token for a new access token                              |
| `getProfile()`                     | `GET /api/auth/profile`                   | Get the authenticated user's profile                                   |
| `setupPassword(email, code, body)` | `POST /api/auth/password-setup`           | Set initial password using a confirmation code                         |
| `changePassword(data)`             | `POST /api/auth/change-password`          | Change password while authenticated                                    |
| `forgotPassword(data)`             | `POST /api/auth/forgot-password`          | Request a password reset code                                          |
| `resetPassword(email, code, body)` | `POST /api/auth/reset-password`           | Reset password using a code                                            |
| `resendRegistrationCode()`         | `POST /api/auth/resend-registration-code` | Resend registration confirmation code                                  |
| `quickLogin(email, password)`      | —                                         | Helper: login + fetch profile and save `userId` to context in one call |

`UserClient` — `src/core/api/clients/user-client.ts`

| Method                       | Endpoint                               | Description                                     |
| ---------------------------- | -------------------------------------- | ----------------------------------------------- |
| `createUser(data)`           | `POST /api/users`                      | Create user; auto-registers ID with `DbCleaner` |
| `getUser(id)`                | `GET /api/users/{id}`                  | Get user by ID                                  |
| `modifyUser(data)`           | `PUT /api/users`                       | Update authenticated user                       |
| `deleteUser()`               | `DELETE /api/users`                    | Delete authenticated user                       |
| `updateUserStatus(data)`     | `PUT /api/users/status`                | Update user status                              |
| `uploadUserAvatar(id, file)` | `PUT /api/users/{id}/avatar`           | Upload avatar (Buffer or Blob)                  |
| `getUserAvatar(id)`          | `GET /api/users/{id}/avatar`           | Fetch avatar                                    |
| `deleteUserAvatar(id)`       | `DELETE /api/users/{id}/avatar`        | Delete avatar                                   |
| `resetUserPassword(id)`      | `PATCH /api/users/{id}/reset-password` | Admin-side password reset                       |
| `saveFcmToken(token)`        | `PUT /api/users/fcm-token`             | Save FCM push token                             |

`GroupClient` — `src/core/api/clients/group-client.ts`

| Method                         | Endpoint                                        | Description                                |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------ |
| `createGroup(data)`            | `POST /api/groups`                              | Create a group                             |
| `getGroup(id)`                 | `GET /api/groups/{id}`                          | Get group by ID                            |
| `getAllGroups()`               | `GET /api/groups`                               | List all groups for the authenticated user |
| `leaveGroup(id)`               | `POST /api/groups/{id}/leave`                   | Leave a group                              |
| `regenerateInviteCode(id)`     | `POST /api/groups/{id}/invite`                  | Regenerate the group invite code           |
| `getBlockedUsers(id)`          | `GET /api/groups/{id}/blocked`                  | Get list of blocked users in a group       |
| `blockUser(groupId, userId)`   | `POST /api/groups/{groupId}/blocked/{userId}`   | Block a user in a group                    |
| `unblockUser(groupId, userId)` | `DELETE /api/groups/{groupId}/blocked/{userId}` | Unblock a user in a group                  |

`ContactClient` — `src/core/api/clients/contact-client.ts`

| Method                            | Endpoint                               | Description                |
| --------------------------------- | -------------------------------------- | -------------------------- |
| `updateContact(targetId, data)`   | `PUT /api/contacts/{targetId}`         | Update a contact           |
| `setContactAlias(targetId, data)` | `PATCH /api/contacts/{targetId}/alias` | Set an alias for a contact |
| `deleteContact(targetId)`         | `DELETE /api/contacts/{targetId}`      | Delete a contact           |

**`TestContext`** stores per-test state and is accessible via `api.getContext()`:

```typescript
interface TestContext {
  accessToken?: string;
  refreshToken?: string;
  userId?: string; // populated automatically by quickLogin()
}
```

**`response-checker`** — `src/core/api/helpers/response-checker.ts`

This module provides two ways to assert or check response status.

`checkResponse` — returns a boolean; use in client code and conditional logic:

```typescript
if (checkResponse.is2xx(result.response)) {
  this.setAccessToken(result.data.accessToken);
}
if (checkResponse.is401(result.response)) {
  // handle unauthorized
}
```

`expect` (custom matchers) — extends Playwright's `expect` with HTTP-aware matchers; import from `api-fixture.ts` in tests:

```typescript
expect(response).toHaveStatus(201); // exactly 201
expect(response).toHaveStatus2xx(); // 200–299
expect(response).toHaveStatus4xx(); // 400–499
expect(response).toHaveStatus5xx(); // 500–599
expect(response).toHaveJsonContent(); // Content-Type: application/json
```

`checkResponse` exposes: `is2xx`, `is200`, `is201`, `is204`, `is4xx`, `is400`, `is401`, `is403`, `is404`, `is5xx`, `is500`, `status`, `json`.

> **Import note:** Always import `expect` from `../fixtures/api-fixture`, not directly from `@playwright/test`. The fixture file re-exports `expect` with the custom matchers merged in.

---

### Database Layer

Direct DB access is used for test setup, cleanup and verification — things that are impractical or slow to do through the API.

**`DbManager`** is a singleton that provides a shared `Kysely<Database>` connection pool. It reads connection parameters from environment variables and uses `CamelCasePlugin` to automatically map `snake_case` DB columns to `camelCase` TypeScript properties.

**`BaseRepository<T, K>`** provides generic methods available to all repositories:

```typescript
getAll(): Promise<T[]>
getById(id: string | number): Promise<T | null>
delete(id: string | number): Promise<void>
findBy(criteria: Partial<T>): Promise<T[]>
```

**Domain repositories** extend `BaseRepository` for their specific table:

- `UserRepository` → `users`
- `GroupRepository` → `group`
- `ContactRepository` → `contacts`
- `ConfirmationCodeRepository` → `confirmation_codes`

**`DbCleaner`** tracks entities that need to be removed after a test:

```typescript
dbCleaner.add('users', createdUser.id);
// ... test runs ...
await dbCleaner.cleanup(); // called automatically via fixture teardown
```

Cleanup runs in **reverse insertion order (LIFO)** to respect foreign key constraints — entities created last are deleted first.

> **Note:** `UserClient.createUser()` automatically registers the created user with `DbCleaner`. For entities created directly via repositories, register them manually with `dbCleaner.add(table, id)`.

**`schema.ts`** maps table names to their TypeScript entity types:

```typescript
interface Database {
  users: UserDbEntity;
  user_passwords: UserPasswordDbEntity;
  user_sessions: UserSessionDbEntity;
  group: GroupDbEntity;
  confirmation_codes: ConfirmationCodeDbEntity;
  external_files: ExternalFileDbEntity;
  contacts: ContactDbEntity;
}
```

---

### Data Builders & Factories

**Builders** use a fluent interface to construct test objects with sensible random defaults. Override only what you need for a specific test case:

```typescript
const user = new UserBuilder().withFirstName('John').withPhone('+380501234567').build();
```

**Factories** wrap common builder patterns into named presets for quick reuse:

```typescript
// Fully random user
const user = UserFactory.createRandomUser();

// Random user with field overrides
const user = UserFactory.createRandomUser({ email: 'custom@test.com' });
```

Use factories in tests whenever possible. Use builders directly when you need fine-grained control.

---

### Fixtures

Fixtures are defined in `src/api/fixtures/api-fixture.ts` and extend Playwright's built-in `test` object. They handle the full lifecycle of test dependencies.

The file also exports the custom `expect` — always import both `test` and `expect` from this file:

```typescript
import { test, expect } from '../fixtures/api-fixture';
```

**Worker-scoped fixture:**

- `db` — a shared `Kysely<Database>` connection reused across all tests in a worker. Torn down once per worker.

**Test-scoped fixtures:**

| Fixture                      | Type                                  | Description                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dbCleaner`                  | `DbCleaner`                           | Fresh instance per test; calls `cleanup()` after the test finishes.                                                                                                                                                      |
| `userRepository`             | `UserRepository`                      | Wired to the test's `db` and `dbCleaner`.                                                                                                                                                                                |
| `groupRepository`            | `GroupRepository`                     | Wired to the test's `db` and `dbCleaner`.                                                                                                                                                                                |
| `contactRepository`          | `ContactRepository`                   | Wired to the test's `db` and `dbCleaner`.                                                                                                                                                                                |
| `confirmationCodeRepository` | `ConfirmationCodeRepository`          | Wired to the test's `db` and `dbCleaner`.                                                                                                                                                                                |
| `api`                        | `ApiClientFactory`                    | Fresh `TestContext` bound to Playwright's `request` context.                                                                                                                                                             |
| `spawnApi`                   | `() => Promise<ApiClientFactory>`     | Factory function — call it to create additional isolated `ApiClientFactory` instances with their own `APIRequestContext`. Useful when a single test needs multiple independent authenticated sessions.                   |
| `spawnUser`                  | `(overrides?) => Promise<UserEntity>` | Creates a fully ready user via API (POST user → fetch confirmation code → setup password) and returns the `UserEntity`. Accepts optional field overrides. The created user is automatically registered with `DbCleaner`. |

**`spawnUser` — quick user creation**

`spawnUser` is the recommended way to create a test user. It handles the full registration flow in one call:

```typescript
test('example', async ({ api, spawnUser }) => {
  // Fully random user
  const user = await spawnUser();

  // User with a specific email (e.g. for forgot-password flows that require a real inbox)
  const user = await spawnUser({ email: 'healthcircle.test@gmail.com' });

  // user.email, user.phone, user.password, user.id are all populated and ready to use
  await api.auth.login({ identifier: user.email, password: user.password });
});
```

**`spawnApi` — multiple independent sessions**

```typescript
test('user A cannot see user B private data', async ({ spawnApi, spawnUser }) => {
  const user1Api = await spawnApi();
  const user2Api = await spawnApi();

  await user1Api.auth.quickLogin('userA@test.com', 'password1');
  await user2Api.auth.quickLogin('userB@test.com', 'password2');

  // user1Api and user2Api have completely separate tokens
});
```

**`clone` and `cloneWithContext`**

`ApiClientFactory` also supports cloning when you need to derive a new client from an existing one mid-test:

```typescript
// New factory with a fresh empty TestContext (no tokens)
const cleanClone = api.clone();

// New factory that copies the current token state — mutations to the clone do not affect the original
const cloneWithContext = api.cloneWithContext();
cloneWithContext.auth.clearTokens(); // only affects the clone
```

---

### Utilities

All utilities are accessible through the `utils` singleton:

```typescript
import { utils } from '../../utils/utils';

utils.random.firstName(); // random first name
utils.random.lastName(); // random last name
utils.random.email({ prefix: 'qa' }); // qa<nanoid>@gmail.com
utils.random.phone(); // international format phone
utils.random.shortId(8); // 8-char nanoid
utils.random.pick([a, b, c]); // random array element
utils.random.number({ min: 1, max: 100 });
utils.random.password(); // random valid password string

utils.date; // DateBuilder instance
```

`RandomHelper` wraps `@faker-js/faker` and `nanoid`. `DateBuilder` provides date arithmetic helpers.

---

## Configuration

### Environment variables

Defined in `.env` at the project root. This file is not committed — create it locally from the template below.

| Variable                        | Used by                         | Description                                                            |
| ------------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| `API_BASE_URL`                  | Playwright config, `BaseClient` | Base URL for all API requests (e.g. `https://api.staging.example.com`) |
| `HEALTHCIRCLE_POSTGRES_HOST`    | `DbManager`                     | Database host                                                          |
| `HEALTHCIRCLE_POSTGRES_PORT`    | `DbManager`                     | Database port                                                          |
| `HEALTHCIRCLE_POSTGRES_USER`    | `DbManager`                     | Database user                                                          |
| `HEALTHCIRCLE_POSTGRES_PASS`    | `DbManager`                     | Database password                                                      |
| `HEALTHCIRCLE_POSTGRES_DB_NAME` | `DbManager`                     | Database name                                                          |
| `HEALTHCIRCLE_POSTGRES_SSL`     | `DbManager`                     | Enable SSL for DB connection (`true`/`false`)                          |

### Playwright config (`playwright.config.ts`)

```
testDir:           src/api/tests    ← where Playwright looks for spec files
timeout:           30 000 ms        ← per-test timeout
actionTimeout:     30 000 ms        ← per-action timeout
navigationTimeout: 60 000 ms        ← fetch timeout
fullyParallel:     true             ← tests within a file run in parallel
workers:           8 (local) / 1 (CI)
retries:           1 (local) / 2 (CI)
reporter:          html             ← output to playwright-report/index.html
screenshot:        only-on-failure
video:             retain-on-failure
trace:             retain-on-failure
```

Tests run against three browser projects (`Desktop Chrome`, `Desktop Safari`, `Desktop Firefox`). For pure API tests the browser choice has no functional effect, but it ensures the request context matches what the application would see from different clients.

On CI (`process.env.CI` is set), `forbidOnly` is enabled — tests with `.only` will fail the run, preventing accidental focused test commits.

---

## Writing Tests

### Step-by-step: creating a new test file

1. Create a new `*.spec.ts` file in the appropriate subdirectory under `src/api/tests/` (e.g. `auth/`, `users/`, `groups/`, `contacts/`).
2. Import `test` **and** `expect` from the fixture file — never from `@playwright/test` directly.
3. Destructure the fixtures you need.
4. Use `spawnUser` to create test users; use other factories for groups, contacts, etc.
5. Call API methods and assert with the custom `expect` matchers.

```typescript
import { test, expect } from '../fixtures/api-fixture';

test('create user and verify profile', async ({ api, spawnUser, confirmationCodeRepository }) => {
  const user = await spawnUser();

  // Log in
  const login = await api.auth.login({ identifier: user.email, password: user.password });
  expect(login.response).toHaveStatus2xx();

  // Verify tokens were saved to context
  expect(api.getContext().accessToken).not.toBeUndefined();

  // Verify profile
  const { data: profile } = await api.auth.getProfile();
  expect(profile?.email).toBe(user.email);

  // DbCleaner removes the created user automatically after the test
});
```

### Testing error cases

```typescript
test('[AUTH-004] Login with non-existent email', async ({ api }) => {
  // No spawnUser needed — testing the failure path
  const login = await api.auth.login({
    identifier: 'non.existent@test.com',
    password: utils.random.password(),
  });
  expect(login.response).toHaveStatus(401);
});
```

### Testing with multiple users

Use `spawnApi` when a test requires two independent sessions:

```typescript
test('user A cannot see user B private data', async ({ spawnApi, spawnUser }) => {
  const apiA = await spawnApi();
  const apiB = await spawnApi();
  const userA = await spawnUser();
  const userB = await spawnUser();

  await apiA.auth.quickLogin(userA.email, userA.password);
  await apiB.auth.quickLogin(userB.email, userB.password);

  // apiA and apiB have separate tokens and do not interfere with each other
  expect(apiA.getContext().accessToken).not.toBe(apiB.getContext().accessToken);
});
```

### Direct DB access in tests

Use repositories when you need to read or verify data that the API doesn't expose:

```typescript
test('confirmation code is created on registration', async ({ api, confirmationCodeRepository }) => {
  const user = UserFactory.createRandomUser();
  const { data } = await api.users.createUser({ ...user });

  const codes = await confirmationCodeRepository.findBy({ userId: data.id });
  expect(codes).toHaveLength(1);
  expect(codes[0].type).toBe('EMAIL_CONFIRMATION');
});
```

---

## Running Tests

```bash
# Install dependencies
npm install

# Run all API tests (all three browser projects)
npx playwright test

# Run a specific test file
npx playwright test src/api/tests/auth/auth.login.spec.ts

# Run tests matching a title pattern
npx playwright test --grep "AUTH-001"

# Run only the Chrome project
npx playwright test --project "API Tests (Chrome)"

# Run with UI mode (useful for debugging individual tests)
npx playwright test --ui

# Show the HTML report after a run
npx playwright show-report
```

On CI the run is triggered via `.github/workflows/playwright.yml`. Workers are capped at 1 on CI to avoid DB contention, and retries are raised to 2 to tolerate transient failures.

---

## Future Plans

The `src/mobile/` directory is reserved for WebdriverIO-based mobile UI and E2E tests, which will be added as the next layer of the framework. The goal is to share the core data builders, factories, and DB utilities across both Playwright API tests and WebdriverIO mobile tests, keeping a single source of truth for test data generation and database access.
