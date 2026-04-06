import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LocationPermissionScreen() {
  // Локальна змінна — зберігає вибір без запитів на сервер
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  const finish = (granted: boolean) => {
    setLocationGranted(granted);
    router.replace("/PushPermissionScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Контент */}
      <View style={styles.content}>
        <Typography variant="h1" tone="primary" style={styles.title}>
          Будь на зв&apos;язку з Колом
        </Typography>

        <Typography variant="body1" tone="secondary" style={styles.subtitle}>
          Дозволь доступ до геолокації, щоб у критичний момент близькі бачили, де ти
        </Typography>

        <Image
          source={require("./geolocation_image.jpg")}
          style={styles.image}
          resizeMode="contain"
        />

        <Typography variant="body2" tone="secondary" style={styles.caption}>
          Ми використовуємо локацію тільки для безпеки — ти завжди контролюєш, хто її бачить
        </Typography>
      </View>

      {/* Кнопка */}
      <View style={styles.footer}>
        <Button
          label="Дозволити доступ до геолокації"
          hierarchy="primary"
          size="large"
          shape="pill"
          onPress={() => finish(true)}
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
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  image: {
    width: "70%",
    aspectRatio: 1,
  },
  caption: {
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[16],
  },
  allowButton: {
    width: "100%",
  },
});
