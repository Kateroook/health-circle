import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { router } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";

export default function Index() {
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const handleNavigate = (path: "/Register" | "/Login") => {
    completeOnboarding();
    router.push(path);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* top spacer */}
        <View style={styles.topSpacer} />

        {/* HERO */}
        <View style={styles.hero}>
          <Image
            source={require("@/src/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Typography variant="h1" style={styles.title}>
            Ласкаво просимо до{"\n"}HealthCircle
          </Typography>

          <Typography variant="subtitle1" tone="secondary" style={styles.subtitle}>
            Твій простір для зв’язку і підтримки
          </Typography>
        </View>

        {/* middle spacer */}
        <View style={styles.middleSpacer} />

        {/* BUTTON GROUP */}
        <View style={styles.buttonGroup}>
          <Button
            label="Зареєструватися"
            hierarchy="primary"
            size="medium"
            shape="rectangle"
            onPress={() => handleNavigate("/Register")}
            style={{ width: "100%" }}
          />

          <Button
            label="Увійти"
            hierarchy="secondary"
            size="medium"
            shape="rectangle"
            onPress={() => handleNavigate("/Login")}
            style={{ width: "100%" }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  container: {
    flex: 1,
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[16],
    backgroundColor: theme.colors.background.primary,
  },

  topSpacer: {
    flex: 2,
  },

  middleSpacer: {
    flex: 3,
  },

  hero: {
    alignItems: "center",
    gap: theme.spacing[8],
  },

  logo: {
    width: 150,
    height: 150,
  },

  title: {
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
  },

  buttonGroup: {
    width: "100%",
    gap: theme.spacing[8],
    marginBottom: theme.spacing[24],
  },
});
