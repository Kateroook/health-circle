import { PasswordField, PinCodeField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
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

export default function ResetPassword() {
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    const passwordError = validatePasswordComplexity(newPassword);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }
    if (newPassword !== confirm) {
      setFormError("Паролі не співпадають");
      return;
    }

    setLoading(true);
    try {
      await apiFetch(
        `/auth/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
        {
          method: "POST",
          body: JSON.stringify({ newPassword, confirmNewPassword: confirm }),
        },
      );
      showMessage({
        message: "Успіх",
        description: "Пароль успішно скинуто. Увійдіть з новим паролем.",
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
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setCountdown(60);
      Alert.alert("Успіх", "Код надіслано повторно на вашу пошту");
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
              Скидання паролю
            </Typography>
            <Typography variant="body2" tone="secondary" style={{ textAlign: "center" }}>
              Введіть код із вашої електронної пошти та новий пароль
            </Typography>
          </View>

          {/* Email Badge */}
          <View style={styles.emailBadge}>
            <Icon name="key" size={16} color="#666" style={{ marginRight: 8 }} />
            <Typography variant="body2" tone="primary">
              {email}
            </Typography>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <PinCodeField
                label="Код підтвердження"
                value={code}
                onChangeText={setCode}
                required
                variant="code"
                errorMessage={formError === "Введіть 6-значний код" ? formError : undefined}
              />
            </View>

            <View style={styles.inputGroup}>
              <PasswordField
                label="Новий пароль"
                placeholder="Введіть новий пароль"
                value={newPassword}
                onChangeText={setNewPassword}
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
                label="Підтвердіть пароль"
                placeholder="Повторіть пароль"
                value={confirm}
                onChangeText={setConfirm}
                required
              />
            </View>

            {formError && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={18} color="#D32F2F" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Typography variant="subtitle1" tone="onColor">
                  {loading ? "Збереження..." : "Скинути пароль"}
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Typography variant="body2" tone="primary">
              Не отримали код?{" "}
            </Typography>
            <Typography
              variant="body2"
              tone="primary"
              weight="bold"
              style={[countdown > 0 && styles.linkDisabled]}
              onPress={handleResendCode}
            >
              {countdown > 0 ? `Надіслати повторно (${countdown}с)` : "Надіслати повторно"}
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
    backgroundColor: theme.colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing[16],
    paddingTop: theme.spacing[10],
    paddingBottom: theme.spacing[40],
  },
  backButton: {
    marginBottom: theme.spacing[10],
    padding: theme.spacing[4],
    alignSelf: "flex-start",
  },
  header: {
    alignItems: "center",
    gap: theme.spacing[8],
    marginBottom: theme.spacing[32],
  },
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[16],
    borderRadius: theme.radius.lg,
    borderWidth: theme.borderWidth.md,
    borderColor: theme.colors.border.opaque,
    marginBottom: theme.spacing[16],
  },
  formContainer: {
    marginBottom: theme.spacing[12],
  },
  inputGroup: {
    marginBottom: theme.spacing[16],
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.lightNegative,
    padding: theme.spacing[12],
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing[16],
  },
  errorText: {
    color: theme.colors.negative,
    fontSize: 14,
    flex: 1,
  },
  buttonsContainer: {
    marginTop: theme.spacing[8],
    gap: theme.spacing[16],
  },
  primaryButton: {
    backgroundColor: theme.colors.primaryB,
    paddingVertical: theme.spacing[16],
    borderRadius: theme.radius.pill,
    alignItems: "center",
    shadowColor: theme.colors.primitives.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: theme.radius.md,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.primitives.black,
    opacity: 0.7,
  },

  footer: {
    alignItems: "center",
    marginTop: theme.spacing[16],
  },

  linkDisabled: {
    color: theme.colors.content.secondary,
  },
});
