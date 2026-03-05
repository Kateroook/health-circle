const { withProjectBuildGradle } = require("@expo/config-plugins");

/**
 * Expo Config Plugin to inject the Notifee maven repository into the android/build.gradle file.
 */
function withNotifeeProjectGradle(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = modifyBuildGradle(config.modResults.contents);
    } else {
      throw new Error("Cannot modify build.gradle because the language is not groovy");
    }
    return config;
  });
}

function modifyBuildGradle(buildGradle) {
  const notifeeRepo = `maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }`;

  // Fix the google-services indentation, as Expo generates it with too much spacing
  buildGradle = buildGradle.replace(
    /^\s+classpath\s+('com\.google\.gms:google-services:[^']+')/gm,
    "    classpath $1",
  );

  // Check if it's already added to avoid duplicates
  if (buildGradle.includes(notifeeRepo)) {
    return buildGradle;
  }

  // Use a safer insertion at the beginning of the repositories block
  const allProjectsMatch = buildGradle.match(/allprojects\s*\{\s*repositories\s*\{/);
  if (allProjectsMatch) {
    const insertIndex = allProjectsMatch.index + allProjectsMatch[0].length;
    return (
      buildGradle.substring(0, insertIndex) +
      `\n    ${notifeeRepo}` +
      buildGradle.substring(insertIndex)
    );
  }

  console.warn(
    "Could not find allprojects { repositories { block in build.gradle to inject Notifee repo.",
  );
  return buildGradle;
}

module.exports = withNotifeeProjectGradle;
