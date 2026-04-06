import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { ScreenIds } from "@/src/utils/testIDs";
import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PushPermissionScreen() {
  const [pushGranted, setPushGranted] = useState<boolean | null>(null);

  const finish = (granted: boolean) => {
    setPushGranted(granted);
    router.replace("/(onboarding)/AvatarPicker");
  };

  return (
    <SafeAreaView
      style={styles.container}
      testID={ScreenIds.pushPermission}
      accessibilityLabel={ScreenIds.pushPermission}
    >
      <View style={styles.skipRow}>
        <Button
          label="Пропустити"
          hierarchy="tertiary"
          size="small"
          shape="rectangle"
          onPress={() => finish(false)}
          testId="auth:skipPush:button"
        />
      </View>

      <View style={styles.content}>
        <Typography variant="h1" tone="primary" style={styles.title}>
          Не проґав головне
        </Typography>

        <Typography variant="body1" tone="secondary" style={styles.subtitle}>
          Дозволь надсилати повідомлення, щоб можна було одним тапом заспокоїти рідних під час
          переклички
        </Typography>

        <Image
          source={require("./push_notifications_image.jpg")}
          style={styles.image}
          resizeMode="contain"
        />

        <Typography variant="body2" tone="secondary" style={styles.caption}>
          Ми сповістимо тебе лише тоді, коли це дійсно важливо: зміна статусу близьких або початок
          тривоги
        </Typography>
      </View>

      <View style={styles.footer}>
        <Button
          label="Дозволити сповіщення"
          hierarchy="primary"
          size="large"
          shape="pill"
          onPress={() => finish(true)}
          style={styles.allowButton}
          testId="auth:allowPush:button"
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
