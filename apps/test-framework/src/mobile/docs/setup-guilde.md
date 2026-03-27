# Mobile Test Automation Setup Guide

This guide covers everything needed to configure a local environment for running mobile tests (WebdriverIO + Appium + Android).

---

## 1. Prerequisites

Ensure the following tools are installed before proceeding.

### Node.js

Required version: **18 or higher** (LTS 22 recommended).

Download from [nodejs.org](https://nodejs.org) or install via a version manager such as `nvm` (macOS/Linux) or `nvm-windows`.

### Java JDK

Required version: **OpenJDK 17**.

**macOS:**
```bash
brew install openjdk@17
```

**Windows:**
```bash
choco install openjdk17
```
Alternatively, download the installer directly from the [Adoptium website](https://adoptium.net).

---

## 2. Android Studio and SDK

The Android Studio IDE itself is not required for running tests, but it is the most reliable way to install the Android SDK and its associated tools.

1. Download and install [Android Studio](https://developer.android.com/studio).
2. Open **SDK Manager**: `Settings -> Languages & Frameworks -> Android SDK`.
3. Under the **SDK Tools** tab, ensure the following are checked and installed:
   - `Android SDK Build-Tools`
   - `Android SDK Command-line Tools (latest)` — required
   - `Android Emulator`
   - `Android SDK Platform-Tools` (provides `adb`)

---

## 3. Environment Variables

The system must know where to find the Android SDK and Java. This is the most critical configuration step.

### macOS (zsh)

Add the following to `~/.zshrc`:

```bash
export JAVA_HOME=$(/usr/libexec/java_home)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$JAVA_HOME/bin
```

Apply the changes:
```bash
source ~/.zshrc
```

### Windows

1. Open **System Properties** -> **Advanced** -> **Environment Variables**.
2. Under **System variables**, create the following new variables:

   | Variable       | Value                                              |
   |----------------|----------------------------------------------------|
   | `ANDROID_HOME` | `C:\Users\<YOUR_USERNAME>\AppData\Local\Android\Sdk` |
   | `JAVA_HOME`    | Path to your JDK installation folder              |

3. Open the `Path` variable and add the following entries:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\cmdline-tools\latest\bin`
   - `%JAVA_HOME%\bin`

4. Open a new terminal window and verify the variables are set:
   ```cmd
   echo %ANDROID_HOME%
   echo %JAVA_HOME%
   ```

---

## 4. Appium Setup

Install the Appium server and the Android driver globally:

```bash
npm install -g appium
appium driver install uiautomator2
```

---

## 5. Device Preparation (Android)

### Physical Device

1. **Enable Developer Mode**: Go to `Settings -> About Phone` and tap `Build Number` seven times.
2. **Enable USB Debugging**: In `Developer Options`, enable `USB Debugging`.
3. **Verify connection**: Connect the device via USB and run:
   ```bash
   adb devices
   ```
   You should see your device ID listed as `device`.

### Emulator

Emulators are created and managed in Android Studio via the **Device Manager**. Once created, the emulator can also be launched automatically using the `start:emulator` script (see the Framework Overview document).

---

## 6. Verification

Install and run `appium-doctor` to confirm the environment is configured correctly:

```bash
npm install -g @appium/doctor
appium-doctor --android
```

A healthy setup will show green checkmarks for `adb`, `ANDROID_HOME`, `JAVA_HOME`, and the command-line tools. If `appium-doctor` reports that `android` or `apkanalyzer` are not found, this is expected on newer SDK versions and can be safely ignored as long as `adb` and `cmdline-tools` are listed as found.

---

## 7. Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```
2. Place the `.apk` file in the directory specified in `wdio.conf.ts`.
3. Run the tests:
   ```bash
   npm run test:mobile:run
   ```

For a full build-and-test pipeline, see the `test:mobile:e2e` script described in the Framework Overview document.

---

## Tips

**Node.js versions:** If you use `nvm`, make sure Appium is installed under the same Node.js version you use for the project. Running `nvm use` before installing Appium globally ensures they match.

**USB cable quality:** Use a data-capable USB cable. A charge-only cable will prevent `adb` from detecting the device, or cause it to disconnect intermittently.

**Emulators:** For consistent test results, use an emulator with a specific, fixed Android API level rather than the latest available.