import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { ScreenIds } from "@/src/utils/testIDs";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Dimensions, Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
export default function LocationPermissionScreen() {
  const [loading, setLoading] = useState(false);

  const finish = () => {
    router.replace("/PushPermissionScreen");
  };

  const handleAllow = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Дозвіл не отримано",
          "Ви можете увімкнути геолокацію пізніше в налаштуваннях пристрою.",
        );
      }
    } catch (e) {
      console.error("Location permission error:", e);
    } finally {
      setLoading(false);
      finish();
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      testID={ScreenIds.locationPermission}
      accessibilityLabel={ScreenIds.locationPermission}
    >
      {/* Пропустити */}
      <View style={styles.skipRow}>
        <Button
          label="Пропустити"
          hierarchy="tertiary"
          size="small"
          shape="rectangle"
          onPress={() => finish(false)}
          testId="auth:skipLocation:button"
        />
      </View>
      <View style={styles.content}>
        <Typography variant="h1" tone="primary" style={styles.title}>
          Будь на зв&apos;язку з Колом
        </Typography>
        <Typography variant="body1" tone="secondary" style={styles.subtitle}>
          Дозволь доступ до геолокації, щоб у критичний момент близькі бачили, де ти
        </Typography>
        <Image
          source={require("./../../assets/images/interactiveScreens/geolocation.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <Typography variant="body2" tone="secondary" style={styles.caption}>
          Ми використовуємо локацію тільки для безпеки — ти завжди контролюєш, хто її бачить
        </Typography>
      </View>
      <View style={styles.footer}>
        <Button
          label="Дозволити доступ до геолокації"
          hierarchy="primary"
          size="large"
          shape="pill"
          onPress={handleAllow}
          loading={loading}
          disabled={loading}
          style={styles.allowButton}
          testId="auth:allowLocation:button"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  skipRow: {
    alignItems: "flex-end",
    paddingHorizontal: theme.spacing[16],
    paddingTop: theme.spacing[8],
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing[24],
    gap: theme.spacing[20],
  },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center" },
  image: { width: width * 0.649, maxHeight: height * 0.181 },
  caption: { textAlign: "center" },
  footer: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[16],
  },
  allowButton: { width: "100%" },
});
