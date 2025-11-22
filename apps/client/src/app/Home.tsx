import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {user ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>👋</Text>
                </View>
                <Text style={styles.greeting}>Вітаємо,</Text>
                <Text style={styles.userName}>{user.firstName}!</Text>
              </View>

              {/* Info Card */}
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Ваш профіль активний</Text>
                <Text style={styles.infoText}>
                  Ви увійшли в систему та маєте доступ до всіх функцій додатку
                </Text>
              </View>

              {/* User Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ім&#39;я:</Text>
                  <Text style={styles.detailValue}>{user.firstName}</Text>
                </View>
                {user.middleName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>По батькові:</Text>
                    <Text style={styles.detailValue}>{user.middleName}</Text>
                  </View>
                )}
                {user.lastName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Прізвище:</Text>
                    <Text style={styles.detailValue}>{user.lastName}</Text>
                  </View>
                )}
                {user.email && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{user.email}</Text>
                  </View>
                )}
                {user.phone && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Телефон:</Text>
                    <Text style={styles.detailValue}>{user.phone}</Text>
                  </View>
                )}
              </View>

              {/* Logout Button */}
              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutButtonText}>Вийти з акаунту</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Guest Mode */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>🔒</Text>
                </View>
                <Text style={styles.title}>Гостьовий режим</Text>
              </View>

              <View style={styles.guestCard}>
                <Text style={styles.guestTitle}>Обмежений доступ</Text>
                <Text style={styles.guestText}>
                  Ви використовуєте додаток у гостьовому режимі. Увійдіть або
                  зареєструйтеся, щоб отримати доступ до всіх функцій
                </Text>
              </View>

              {/* Features List */}
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>З акаунтом ви зможете:</Text>
                {[
                  "Зберігати персональні дані",
                  "Синхронізувати між пристроями",
                  "Отримувати повідомлення",
                  "Користуватися всіма функціями",
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={styles.featureIcon}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E8F5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 36,
  },
  greeting: {
    fontSize: 18,
    color: "#666",
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: "#E8F8F5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#388E3C",
    lineHeight: 20,
  },
  detailsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  guestCard: {
    backgroundColor: "#FFF3E0",
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E65100",
    marginBottom: 8,
  },
  guestText: {
    fontSize: 14,
    color: "#F57C00",
    lineHeight: 20,
  },
  featuresContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 18,
    color: "#4CAF50",
    marginRight: 12,
    fontWeight: "700",
  },
  featureText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
});
