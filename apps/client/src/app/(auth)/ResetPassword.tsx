import { Button } from "@/src/components/Button";
import { PasswordField, PinCodeField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { ScreenIds } from "@/src/utils/testIDs";
import { Feather as Icon } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../api/api";
import { useAnalytics } from "../../hooks/useAnalytics";
import { formatErrorMessage } from "../../utils/error.util";
import { validatePasswordComplexity } from "../../utils/passwordValidation.util";

const { width, height } = Dimensions.get("window");

export default function ResetPassword() {
  const { logEvent } = useAnalytics();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

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
      logEvent("password_reset_successful");
      setShowPasswordSuccess(true);
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
    <SafeAreaView
      style={styles.safeArea}
      testID={ScreenIds.resetPassword}
      accessibilityLabel={ScreenIds.resetPassword}
    >
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
            testId="auth:back:button"
          />

          <View style={styles.header}>
            <Typography variant="h2" tone="primary">
              Скидання паролю
            </Typography>
            <Typography variant="body2" tone="secondary" style={{ textAlign: "center" }}>
              Введіть код із вашої електронної пошти та новий пароль
            </Typography>
          </View>

          <View style={styles.emailBadge}>
            <Icon name="key" size={16} color="#666" style={{ marginRight: 8 }} />
            <Typography variant="body2" tone="primary">
              {email}
            </Typography>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <PinCodeField
                label="Код підтвердження"
                value={code}
                onChangeText={setCode}
                required
                variant="code"
                errorMessage={formError === "Введіть 6-значний код" ? formError : undefined}
                testId="auth:code:input"
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
                testId="auth:newPassword:input"
              />
            </View>

            <View style={styles.inputGroup}>
              <PasswordField
                label="Підтвердіть пароль"
                placeholder="Повторіть пароль"
                value={confirm}
                onChangeText={setConfirm}
                required
                testId="auth:confirmNewPassword:input"
              />
            </View>

            {formError && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={18} color="#D32F2F" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.buttonsContainer}>
              <Button
                label={loading ? "Збереження..." : "Скинути пароль"}
                hierarchy="primary"
                shape="rectangle"
                size="medium"
                loading={loading}
                disabled={loading}
                onPress={handleSubmit}
                style={{ width: "100%" }}
                testId="auth:submit:button"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Typography variant="body2" tone="primary">
              Не отримали код?{" "}
            </Typography>
            <Typography
              variant="body2"
              tone="primary"
              weight="bold"
              testId="auth:resendCode:link"
              style={[countdown > 0 && styles.linkDisabled]}
              onPress={handleResendCode}
            >
              {countdown > 0 ? `Надіслати повторно (${countdown}с)` : "Надіслати повторно"}
            </Typography>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Password Success Modal */}
      <Modal
        visible={showPasswordSuccess}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPasswordSuccess(false)}
      >
        <SafeAreaView style={successStyles.container}>
          <Typography variant="h2" tone="primary" style={successStyles.title}>
            Пароль змінено
          </Typography>
          <Image
            source={require("./../../assets/images/interactiveScreens/password_change.png")}
            style={successStyles.image}
            resizeMode="contain"
          />
          <Button
            label="Увійти в акаунт"
            hierarchy="primary"
            size="large"
            shape="pill"
            onPress={() => {
              setShowPasswordSuccess(false);
              router.replace("/Login");
            }}
            style={successStyles.button}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background.primary },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing[16],
    paddingTop: theme.spacing[10],
    paddingBottom: theme.spacing[40],
  },
  header: { alignItems: "center", gap: theme.spacing[8], marginBottom: theme.spacing[32] },
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
  formContainer: { marginBottom: theme.spacing[12] },
  inputGroup: { marginBottom: theme.spacing[16] },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.lightNegative,
    padding: theme.spacing[12],
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing[16],
  },
  errorText: { color: theme.colors.negative, fontSize: 14, flex: 1 },
  buttonsContainer: { marginTop: theme.spacing[8], gap: theme.spacing[16] },
  footer: { alignItems: "center", marginTop: theme.spacing[16] },
  linkDisabled: { color: theme.colors.content.secondary },
});

const successStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing[24],
    paddingTop: theme.spacing[64],
    paddingBottom: theme.spacing[40],
  },
  title: { textAlign: "center" },
  image: { width: width * 0.417, maxHeight: height * 0.235 },
  button: { width: "100%" },
});
