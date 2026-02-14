# HealthCircle Client 👋

This is the mobile client for HealthCircle, built with [Expo](https://expo.dev).

## Prerequisites

Before you start, ensure you have the following installed:

1.  **Node.js**: Latest LTS version.
2.  **Java Development Kit (JDK)**: OpenJDK 17 is recommended.
3.  **Android SDK**: Install via Android Studio, including **SDK Platform-Tools** (for `adb`).

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

## Android Physical Device Setup

To run the app on a physical Android device:

1.  **Enable Developer Options**: Go to *Settings > About phone* and tap *Build number* 7 times.
2.  **Enable USB Debugging**: Go to *Settings > Developer options* and toggle *USB debugging* on.
3.  **Connect Device**: Plug your device into your computer via USB.
4.  **Verify Connection**:
    ```bash
    adb devices
    ```
    You should see your device listed.

## Running the App

### Development Build (Android)

To build and run the app on your connected Android device:

```bash
npm run android
```

This command will:
-   Start the Expo CLI.
-   Compile the native Android code.
-   Install and launch the **development build** on your device.

### iOS (Simulator)

If you are on macOS and have Xcode installed:

```bash
npm run ios
```

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/docs/getting-started)

