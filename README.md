# HealthCircle Monorepo

Монорепозиторій для мобільного додатку **HealthCircle**, що включає:

- **Client**: мобільний додаток на Expo + React Native + TypeScript
- **Core API**: бекенд на NestJS + TypeORM + PostgreSQL

### Triggering the Build
1.  Go to the **Actions** tab in the GitHub repository.
2.  Select **Build Android APK** from the workflows list.
3.  Click **Run workflow**.
4.  Once finished, the `.apk` file will be available in the **Artifacts** section of the run summary.

---

## Встановлення залежностей

Встановіть залежності для всіх додатків окремо у кожній папці:

```bash
cd apps/client
npm install

cd ../core-api
npm install
```

---

## Client (Expo)

Папка: `apps/client`

### Запуск

```bash
npx expo start
```

Відкриється Expo Dev Tools, де можна:

- Запуск на iOS simulator (macOS)
- Запуск на Android emulator
- Відкриття у Expo Go на фізичному пристрої

---

## Core API (NestJS)

Папка: `apps/core-api`

### Запуск сервера

```bash
npm run start:dev
```

Сервер буде доступний на `http://localhost:3000`.
