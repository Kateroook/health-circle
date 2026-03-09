import { PasswordField, TextField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { apiFetch } from "../../api/api";
import { formatErrorMessage } from "../../utils/error.util";
import { validatePasswordComplexity } from "../../utils/passwordValidation.util";

export default function PasswordSetup() {
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleSubmit() {
    setFormError("");
    if (!code || code.length < 6) {
      setFormError("Введіть 6-значний код");
      return;
    }
    const passwordError = validatePasswordComplexity(password);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Паролі не співпадають");
      return;
    }

    setLoading(true);
    try {
      await apiFetch(
        `/auth/password-setup?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
        {
          method: "POST",
          body: JSON.stringify({ newPassword: password, confirmNewPassword: confirmPassword }),
        },
      );
      showMessage({
        message: "Успіх",
        description: "Ваш акаунт успішно підтверджено. Тепер ви можете увійти.",
        type: "success",
        duration: 3000,
      });
      router.replace("/Login");
    } catch (e: any) {
      setFormError(formatErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (countdown > 0) return;
    try {
      await apiFetch("/auth/resend-registration-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setCountdown(60);
      Alert.alert("Успіх", "Код надіслано повторно");
    } catch (e: any) {
      Alert.alert("Помилка", formatErrorMessage(e));
    }
  }

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
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Icon name="arrow-left" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Typography variant="h2" tone="primary">
              Створюємо твій акаунт
            </Typography>
            <Typography variant="body1" tone="secondary">
              Ми надіслали код підтвердження на {email}. Будь ласка, введіть його нижче.
            </Typography>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <TextField
                label="Код підтвердження"
                placeholder="000 000"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                required
              />
            </View>

            <View style={styles.inputGroup}>
              <PasswordField
                label="Пароль"
                placeholder="Введіть пароль"
                value={password}
                onChangeText={setPassword}
                required
                caption="Мінімум 12 символів: великі, малі літери, цифри та символи"
                errorMessage={
                  formError &&
                  (formError.includes("Новий пароль") || formError.includes("Пароль має"))
                    ? formError
                    : undefined
                }
              />
            </View>

            <View style={styles.inputGroup}>
              <PasswordField
                label="Підтвердьте пароль"
                placeholder="Повторіть пароль"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                required
              />
            </View>

            {formError && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={18} color="#D32F2F" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Зачекайте..." : "Підтвердити"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Typography variant="body2" tone="primary" style={styles.footerText}>
              Не отримали код?{" "}
              <Typography
                variant="body2"
                tone="primary"
                weight="bold"
                style={[countdown > 0 && styles.linkDisabled]}
                onPress={handleResendCode}
              >
                {countdown > 0 ? `Надіслати повторно (${countdown}с)` : "Надіслати повторно"}
              </Typography>
            </Typography>
          </View>
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 10,
    padding: 4,
    alignSelf: "flex-start",
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 18,
    color: "#1A1A1A",
    borderWidth: 1.5,
    borderColor: "#1A1A1A",
    textAlign: "center",
    letterSpacing: 4,
    fontWeight: "700",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#1A1A1A",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1A1A1A",
  },
  eyeButton: {
    paddingHorizontal: 16,
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#000000",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000000",
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
  buttonDisabled: {
    backgroundColor: "#000000",
    opacity: 0.7,
  },
  footer: {
    alignItems: "center",
    marginTop: 10,
  },
  footerText: {
    fontSize: 14,
    color: "#000000",
  },
  footerLink: {
    color: "#000000",
    fontWeight: "600",
  },
  linkDisabled: {
    color: "#999",
  },
});
