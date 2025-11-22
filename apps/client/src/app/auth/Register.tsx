import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../../api/api";

export default function Register() {
  const [form, setForm] = useState({
    phone: "",
    email: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key: string, value: string) =>
    setForm({ ...form, [key]: value });

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      await apiFetch("/users", { method: "POST", body: JSON.stringify(form) });
      router.push({
        pathname: "/auth/PasswordSetup",
        params: { email: form.email },
      });
    } catch (e: any) {
      // Парсимо помилку для читабельного виводу
      let errorMessage = "Сталася помилка";

      if (e.message) {
        try {
          // Якщо помилка у форматі JSON
          const parsed = JSON.parse(e.message);
          if (parsed.message) {
            if (Array.isArray(parsed.message)) {
              errorMessage = parsed.message.join(", ");
            } else {
              errorMessage = parsed.message;
            }
          }
        } catch {
          // Якщо не JSON, використовуємо як є
          errorMessage = e.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "firstName", label: "Ім'я", placeholder: "Введіть ім'я" },
    {
      key: "middleName",
      label: "По батькові",
      placeholder: "Введіть по батькові",
    },
    { key: "lastName", label: "Прізвище", placeholder: "Введіть прізвище" },
    {
      key: "phone",
      label: "Телефон",
      placeholder: "+380 XX XXX XX XX",
      keyboardType: "phone-pad",
    },
    {
      key: "email",
      label: "Email",
      placeholder: "example@mail.com",
      keyboardType: "email-address",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👤</Text>
            </View>
            <Text style={styles.title}>Створення акаунту</Text>
            <Text style={styles.subtitle}>
              Заповніть дані, щоб приєднатися до кола турботи
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {fields.map(({ key, label, placeholder, keyboardType }) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChangeText={(v) => handleChange(key, v)}
                  keyboardType={keyboardType as any}
                  style={styles.input}
                  placeholderTextColor="#999"
                />
              </View>
            ))}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Зачекайте..." : "Зареєструватися"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => router.replace("/Home")}
              >
                <Text style={styles.skipButtonText}>Пропустити</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Вже є акаунт?{" "}
            <Text
              style={styles.footerLink}
              onPress={() => router.push("/auth/Login")}
            >
              Увійти
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    flex: 1,
  },
  buttonsContainer: {
    marginTop: 8,
    gap: 12,
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
  buttonDisabled: {
    backgroundColor: "#FFB3B3",
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#999",
    fontSize: 15,
    fontWeight: "500",
  },
  footer: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginTop: 16,
    marginBottom: 20,
  },
  footerLink: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
});
