import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>&#x2764;&#xfe0f;</Text>
          </View>
          <Text style={styles.title}>HealthCircle</Text>
          <Text style={styles.subtitle}>Спокій вашої родини</Text>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Одна кнопка — і ваші близькі знають, що ви в безпеці. Будьте на
            зв&#39;язку під час тривоги навіть без інтернету.
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>&#x1F7E2;</Text>
              <Text style={styles.featureText}>
                Статус &quot;У безпеці&quot; одним натисканням
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>&#x1F6A8;</Text>
              <Text style={styles.featureText}>
                SOS-сповіщення через SMS без інтернету
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>&#x1F465;</Text>
              <Text style={styles.featureText}>
                Кола близьких із відстеженням статусів
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>&#x1F4CB;</Text>
              <Text style={styles.featureText}>
                Історія останніх змін статусу
              </Text>
            </View>
          </View>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/Register")}
          >
            <Text style={styles.primaryButtonText}>Створити акаунт</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/Login")}
          >
            <Text style={styles.secondaryButtonText}>Увійти</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 0,
    backgroundColor: "#FAFAFA",
    justifyContent: "flex-start",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  descriptionContainer: {
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  featuresContainer: {
    width: "100%",
    gap: 10,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  buttonsContainer: {
    width: "100%",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  secondaryButtonText: {
    color: "#FF6B6B",
    fontSize: 17,
    fontWeight: "600",
  },

  footer: {
    textAlign: "center",
    fontSize: 13,
    color: "#999",
  },
});
