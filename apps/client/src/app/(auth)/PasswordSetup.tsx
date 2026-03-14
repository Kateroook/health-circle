import { Button } from "@/src/components/Button";
import { PasswordField, PinCodeField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useAnalytics } from "../../hooks/useAnalytics";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showMessage } from "react-native-flash-message";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { apiFetch } from "../../api/api";
import { formatErrorMessage } from "../../utils/error.util";
import { validatePasswordComplexity } from "../../utils/passwordValidation.util";

export default function PasswordSetup() {
  const { logEvent } = useAnalytics();
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
      logEvent("sign_up", { method: "form" });
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
      logEvent("resend_code");
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
          <Button
            shape="round"
            hierarchy="tertiary"
            size="medium"
            leadingIcon={<Icon name="arrow-left" size={24} color={theme.colors.content.primary} />}
            onPress={() => router.back()}
            style={{ alignSelf: "flex-start" }}
          />

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
              <PinCodeField
                label="Код підтвердження"
                value={code}
                onChangeText={setCode}
                required
                variant="pin"
                errorMessage={formError === "Введіть 6-значний код" ? formError : undefined}
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
            <Button
              label={loading ? "Зачекайте..." : "Підтвердити"}
              hierarchy="primary"
              shape="rectangle"
              size="medium"
              loading={loading}
              disabled={loading}
              onPress={handleSubmit}
              style={{ width: "100%" }}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Typography variant="body2" tone="primary">
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
  header: {
    alignItems: "center",
    marginBottom: theme.spacing[32],
  },
  formContainer: {
    marginBottom: theme.spacing[16],
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

  footer: {
    alignItems: "center",
    marginTop: theme.spacing[10],
  },

  linkDisabled: {
    color: theme.colors.content.tertiary,
  },
});
