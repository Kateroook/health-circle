# HealthCircle Client 👋

This is the mobile client for HealthCircle, built with [Expo](https://expo.dev).

## Prerequisites

Before building or running the project, you need to set up the following tools:

1. **Node.js**: Use Node v24 LTS.
   - We recommend using `nvm` (Node Version Manager) to switch versions if you have multiple projects.

2. **Java Development Kit (JDK)**: OpenJDK 17 is strictly required.
   - Newer versions like Java 21 may cause compatibility issues with Expo Android builds. You can install it via Homebrew on macOS (`brew install openjdk@17`) or through your system package manager.

3. **Android Studio & SDK**:
   - Install [Android Studio](https://developer.android.com/studio).
   - In Android Studio, go to **SDK Manager** -> **SDK Platforms** and ensure at least one modern Android SDK is installed (e.g. Android 14/API 34).
   - Go to **SDK Tools** and ensure you have **Android SDK Build-Tools** and **Android SDK Platform-Tools** (for `adb`).

4. **Android Emulator**:
   - In Android Studio, open the **Virtual Device Manager** and download a new Pixel device image.
   - Run the emulator inside Android Studio, or boot it from the terminal before attempting to launch the app.

5. **Xcode (for iOS)**:
   - If you are on a Mac and want to develop for iOS, install Xcode from the Mac App Store.
   - Run Xcode once to install necessary components and ensure the Command Line Tools are correctly set up (Xcode > Settings > Locations).

## Get Started

1.  **Install dependencies**

    ```bash
    npm install
    ```

2.  **Configure environment**
    Copy the example environment file and update it if necessary:

    ```bash
    cp .env.example .env
    ```

    Ensure `EXPO_PUBLIC_API_URL` points to your backend (local or production).

3.  **Configure Firebase**
    To run the app on your device or simulator, you must fetch the Firebase configuration files from your Firebase Console and place them in the root `apps/client` directory:
    - **Android**: Download `google-services.json` and place it in `apps/client/`. (Without this, the Android build will fail).
    - **iOS**: Download `GoogleService-Info.plist` and place it in `apps/client/`. (Without this, the iOS build will fail).

## Android Physical Device Setup

If you prefer testing on a physical Android device rather than an emulator:

1.  **Enable Developer Options**: Go to _Settings > About phone_ and tap _Build number_ 7 times.
2.  **Enable USB Debugging**: Go to _Settings > Developer options_ and toggle _USB debugging_ on.
3.  **Connect Device**: Plug your device into your computer via USB.
4.  **Verify Connection**:
    ```bash
    adb devices
    ```
    You should see your device listed.

## Running the App

### Development Build (Android)

When starting fresh, dealing with native module issues, or needing to recreate the native Android project files, you should generate a clean prebuild:

```bash
npx expo prebuild --clean --platform android
```

> **Note**: This project uses a custom Expo Config Plugin (`plugins/withNotifeeProjectGradle.js`) to automatically inject native Android repositories for Notifee and Firebase. Additionally, Android Push Notification permissions (e.g., `POST_NOTIFICATIONS`) are properly managed in `app.config.js`. You do not need to manually configure `android/build.gradle` or `AndroidManifest.xml`.

After generating the prebuild, you can build and run the app on your connected Android device:

```bash
npm run android
```

This command will:

- Start the Expo CLI.
- Compile the native Android code.
- Install and launch the **development build** on your device.

### Troubleshooting

If you run into missing dependencies, mismatched versions, or other Expo environment issues, run Expo Doctor to diagnose and fix them:

```bash
npx expo-doctor
```

### iOS (Simulator)

If you have Xcode configured and specifically placed `GoogleService-Info.plist` in the `apps/client` folder, you can build and launch the iOS Simulator natively:

```bash
npm run ios
```

This command automatically generates the native iOS project files (via prebuild), installs required CocoaPods, and boots up the default simulator.

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/docs/getting-started)
