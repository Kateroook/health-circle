const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo SDK 52 / React Native 0.76 New Architecture strict module imports
 * cause Firebase to fail compiling when `useFrameworks: "static"` is enabled
 * because it pulls in non-modular React headers inside a framework module.
 *
 * Instead of patching the `@react-native-firebase` source code headers,
 * this overrides the strict Clang setting triggered by Xcode for all CocoaPods targets,
 * gracefully allowing them to include non-modular headers.
 */
function withPodfileAllowNonModularIncludes(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, "Podfile");

      if (!fs.existsSync(file)) {
        return config;
      }

      let contents = fs.readFileSync(file, "utf-8");

      const injectString = `
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end
`;

      if (contents.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES")) {
        return config;
      }

      // Inject into the post_install block created natively by Expo
      contents = contents.replace(
        /post_install\s+do\s+\|installer\|/,
        `post_install do |installer|${injectString}`,
      );

      fs.writeFileSync(file, contents);
      return config;
    },
  ]);
}

module.exports = withPodfileAllowNonModularIncludes;
