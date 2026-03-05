const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo Config Plugin to use pre-built Firestore frameworks.
 * This significantly reduces iOS build time by avoiding compilation of Firestore C++ code.
 */
function withFirestorePrebuilt(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, "Podfile");

      if (!fs.existsSync(file)) {
        return config;
      }

      let contents = fs.readFileSync(file, "utf-8");

      // Add the pre-built firestore pod.
      // Note: The tag should match the Firebase version used by @react-native-firebase/firestore.
      // For RNF 23.x, it's typically Firebase 11.2.0+
      const firestorePod =
        "  pod 'FirebaseFirestore', :git => 'https://github.com/invertase/firestore-ios-sdk-frameworks.git', :tag => '12.8.0'";

      if (contents.includes("FirebaseFirestore") && contents.includes(":git")) {
        return config;
      }

      // Inject after use_native_modules! or at the end of the main target block
      if (contents.includes("pod 'FirebaseFirestore'")) {
        // Replace existing pod if it exists as a standard one
        contents = contents.replace(/pod 'FirebaseFirestore'/, firestorePod);
      } else {
        // Inject near other Firebase pods or before use_native_modules!
        // We use a regex that matches the entire line to avoid breaking assignments like 'config = use_native_modules!'
        contents = contents.replace(
          /^(\s*).*use_native_modules!.*$/m,
          (match) => `${firestorePod}\n${match}`,
        );
      }

      fs.writeFileSync(file, contents);
      return config;
    },
  ]);
}

module.exports = withFirestorePrebuilt;
