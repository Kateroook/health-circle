# Framework Overview & Test Strategy

## Architecture

The test framework is composed of two independent testing layers:

### Mobile Layer (WebdriverIO + Appium + UiAutomator2)

- **WebdriverIO** — the test runner and assertion library. It orchestrates test execution, manages sessions, and provides the API for interacting with UI elements.
- **Appium** — a local server that acts as a bridge between WebdriverIO and the Android device or emulator. It translates WebdriverIO commands into native Android actions.
- **UiAutomator2** — the Appium driver installed on top of the Android device. It is the component that actually interacts with the application UI at the OS level.
- **Android SDK / ADB** — low-level tooling that Appium relies on to communicate with the device (install APKs, forward ports, capture logs).

The overall flow during a test run:

```
WebdriverIO (test code)
    -> Appium Server (localhost:4723)
        -> UiAutomator2 driver
            -> Android Device / Emulator
```

### API Layer (Playwright)

- **Playwright** — used independently for API-level tests. It runs separately from the mobile layer and has no dependency on Appium or Android tooling.

---

## Test Strategy

The primary focus of the mobile test suite is **regression testing** against a release build of the application. Tests are written to verify that existing functionality has not been broken.

### Standard Workflow

The typical workflow is to test against the latest stable release APK:

1. Obtain the current release APK (either from the repository or by building it locally — see the `build:apk` script below).
2. Place the APK in the path specified in `wdio.conf.ts`.
3. Start the emulator and run the tests.

This is the most common scenario and is covered by the `test:mobile:run` and `test:mobile:e2e` scripts.

### Testing Against a Development Branch

Occasionally, it is necessary to validate changes from the `dev` branch before they are promoted to a release. In this case:

1. Pull the latest changes from the `dev` branch in the client folder.
2. Rebuild the APK using the `build:apk` script.
3. Run the full test suite against the freshly built APK.

This workflow is less frequent and is primarily used to catch regressions introduced by new features before a release.

---

## NPM Scripts

All commands are run from the root of the test framework repository.

### `start:emulator`

```bash
npm run start:emulator
```

Launches the Android emulator defined in the script (`src/scripts/start-emulator.ts`). The script handles waiting for the emulator to fully boot before returning, so it is safe to chain with other commands.

### `test:mobile:run`

```bash
npm run test:mobile:run
```

Starts the emulator and immediately runs the WebdriverIO mobile test suite against the APK configured in `wdio.conf.ts`. Use this command when you already have a built APK and only want to execute the tests.

### `test:mobile:e2e`

```bash
npm run test:mobile:e2e
```

The full end-to-end pipeline. It first builds a fresh release APK from the client project (`build:apk`), then runs the mobile test suite (`test:mobile:run`). Use this command when you need to test a specific state of the client codebase from scratch.

### `build:apk`

```bash
npm run build:apk
```

Navigates to the client project, removes any existing Android build artifacts, runs `expo prebuild` to generate a clean native Android project, and then assembles the release APK using Gradle. The output APK will be located at:

```
../client/android/app/build/outputs/apk/release/app-release.apk
```

### `test:api`

```bash
npm run test:api
```

Runs the Playwright API test suite. This command is fully independent of Appium and the Android toolchain.
