# Appium Inspector Guide

Appium Inspector is a graphical client for inspecting the element tree (DOM) of a mobile application and finding locators (`accessibilityLabel`, `UiSelector`, `XPath`) for use in automated tests.

---

## Prerequisites

Before opening Appium Inspector, confirm the following:

1. An Android emulator is running, or a physical Android device is connected via USB.
2. The Appium server is running in a separate terminal window (command: `appium`).
3. You have a built `.apk` file available on your local disk.

---

## Download

Download the latest release of Appium Inspector from the [official GitHub releases page](https://github.com/appium/appium-inspector/releases).

- **macOS:** Download the `.dmg` file, open it, and drag the app to your Applications folder.
- **Windows:** Download the `.exe` installer and run it.

---

## Connection Settings (Remote Server)

On the Inspector's main screen, configure the connection parameters as follows:

| Field       | Value       |
| ----------- | ----------- |
| Remote Host | `127.0.0.1` |
| Remote Port | `4723`      |
| Remote Path | `/`         |

> The Remote Path must be a single forward slash (`/`). This is required for Appium 2.x and differs from the legacy `/wd/hub` path used in Appium 1.x.

---

## Capabilities (JSON Representation)

To avoid entering each capability manually, switch to the **JSON Representation** tab, click the edit icon (pencil), paste the configuration below, and click **Save**.

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:deviceName": "emulator-5554",
  "appium:app": "/absolute/path/to/your/app-release.apk",
  "appium:appPackage": "com.healthcircle.app",
  "appium:appWaitActivity": "*",
  "appium:appActivity": ".MainActivity",
  "appium:noReset": false,
  "appium:ensureWebviewsHavePages": true,
  "appium:autoGrantPermissions": true
}
```

**macOS** — the `appium:app` path will follow the format:

```
/Users/<username>/path/to/app-release.apk
```

**Windows** — the `appium:app` path will follow the format:

```
C:\\Users\\<username>\\path\\to\\app-release.apk
```

Note the double backslashes, which are required inside a JSON string on Windows.

### Inspecting a Specific Screen Without Restarting the App

If you need to inspect a screen that is deep within the application (for example, a Profile screen), navigate to that screen manually on the emulator first. Then change `"appium:noReset"` to `true` in the JSON and start the session. Appium will attach to the currently visible screen without reinstalling or relaunching the application.

---

## Troubleshooting

### `NoSuchDriverError: A session is either terminated or not started`

**Symptoms:** Inspector hangs indefinitely after clicking "Start Session", or the error appears immediately.

**Cause:** A known issue in the desktop client where it attempts to reconnect to a previously closed session, or a stale session is still registered on the Appium server.

**Resolution:**

1. Fully quit Appium Inspector (on macOS: `Cmd + Q`; on Windows: close via the taskbar tray).
2. Stop the Appium server in the terminal (`Ctrl + C`) and restart it (`appium`).
3. Reopen Inspector and start a new session.

---

### `MainActivity never started`

**Symptoms:** Appium installs the application but then times out waiting for it to launch.

**Cause:** React Native and Expo applications can have non-standard activity names at startup, or take longer than expected to load the JavaScript bundle.

**Resolution:** Ensure the capability `"appium:appWaitActivity": "*"` is present in your configuration. This tells Appium to wait for any activity belonging to the application to appear, rather than waiting for a specific named activity.

---

### `The application at '...' does not exist`

**Symptoms:** The error appears within the first few seconds of starting a session.

**Cause:** Appium Inspector requires an **absolute path** to the `.apk` file. Relative paths (e.g., `../`) are not supported.

**Resolution:** Verify the `appium:app` value and replace it with a full absolute path:

- macOS: starting from `/Users/...`
- Windows: starting from `C:\\Users\\...`
