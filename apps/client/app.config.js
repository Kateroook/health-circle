export default {
  expo: {
    name: "Health Circle",
    slug: "health-circle",
    version: "1.0.2",
    orientation: "portrait",
    platforms: ["ios", "android"],
    icon: "./src/assets/images/icon.png",
    scheme: "client",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.healthcircle.app",
      googleServicesFile: process.env.GOOGLE_SERVICES_IOS || "./GoogleService-Info.plist",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["fetch", "remote-notification", "location"],
        NSLocationWhenInUseUsageDescription:
          "Allow Health Circle to access your location to share your safety status with your circles.",
        NSLocationAlwaysUsageDescription:
          "Allow Health Circle to access your location in the background to keep your safety status updated and share it with your circles.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Allow Health Circle to access your location to share your safety status with your circles and provide real-time updates.",
        NSCameraUsageDescription:
          "Allow Health Circle to access your camera to take a profile picture.",
        NSPhotoLibraryUsageDescription:
          "Allow Health Circle to access your photo library to choose a profile picture.",
        FirebaseAppDelegateProxyEnabled: true,
      },
    },
    android: {
      package: "com.healthcircle.app",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#f5f7fa",
        foregroundImage: "./src/assets/images/icon.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.VIBRATE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
      ],
    },
    plugins: [
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      "./plugins/withPodfileAllowNonModularIncludes.js",
      "./plugins/withFirestorePrebuilt.js",
      "expo-notifications",
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUseUsageDescription:
            "Allow Health Circle to access your location to share your safety status with your circles and provide real-time updates.",
          locationWhenInUseUsageDescription:
            "Allow Health Circle to access your location to share your safety status with your circles.",
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./src/assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: false,
          },
          ios: {
            useFrameworks: "static",
            forceStaticLinking: [
              "RNFBApp",
              "RNFBMessaging",
              "RNFBFirestore",
              "FirebaseCore",
              "FirebaseMessaging",
              "FirebaseFirestore",
              "FirebaseInstallations",
            ],
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "f474f1ed-3a43-48d9-969e-db3ddac58997",
      },
    },
    owner: "vlad_risenhin",
  },
};
