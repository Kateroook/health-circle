import { Button } from "@/src/components/Button";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>&#x2764;&#xfe0f;</Text>
          </View>
          <Typography variant="h1" tone="primary" style={styles.title}>
            HealthCircle
          </Typography>
          <Typography variant="subtitle1" tone="secondary" style={styles.subtitle}>
            Спокій вашої родини
          </Typography>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionContainer}>
          <Typography variant="body1" tone="primary" style={styles.description}>
            Одна кнопка — і ваші близькі знають, що ви в безпеці. Будьте на зв&#39;язку під час
            тривоги навіть без інтернету.
          </Typography>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>&#x1F7E2;</Text>
              <Typography variant="body2" tone="primary" style={styles.featureText}>
                Статус &quot;У безпеці&quot; одним натисканням
              </Typography>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>&#x1F6A8;</Text>
              <Typography variant="body2" tone="primary" style={styles.featureText}>
                SOS-сповіщення через SMS без інтернету
              </Typography>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>&#x1F465;</Text>
              <Typography variant="body2" tone="primary" style={styles.featureText}>
                Кола близьких із відстеженням статусів
              </Typography>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>&#x1F4CB;</Text>
              <Typography variant="body2" tone="primary" style={styles.featureText}>
                Історія останніх змін статусу
              </Typography>
            </View>
          </View>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsContainer}>
          <Button
            label="Створити акаунт"
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
    paddingHorizontal: theme.spacing[24],
    paddingVertical: 0,
    backgroundColor: theme.colors.background.primary,
    justifyContent: "flex-start",
  },
  header: {
    alignItems: "center",
    marginTop: theme.spacing[40],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    marginBottom: theme.spacing[8],
  },
  subtitle: {
    marginTop: theme.spacing[4],
  },
  descriptionContainer: {
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: theme.spacing[20],
  },
  featuresContainer: {
    width: "100%",
    gap: theme.spacing[10],
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing[12],
    borderRadius: theme.radius.lg,
    shadowColor: theme.colors.primitives.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: theme.spacing[8],
    elevation: theme.spacing[2],
  },
  featureIcon: {
    fontSize: 24,
    marginRight: theme.spacing[12],
  },
  featureText: {
    fontSize: 13,
  },
  buttonsContainer: {
    width: "100%",
    gap: theme.spacing[16],
  },

  footer: {
    textAlign: "center",
    fontSize: 13,
    color: "#999",
  },
});
