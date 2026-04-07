import { Button } from "@/src/components/Button";
import { TextField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { ScreenIds } from "@/src/utils/testIDs";
import { Feather as Icon } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../api/api";
import { useAnalytics } from "../../hooks/useAnalytics";
import { formatErrorMessage } from "../../utils/error.util";

export default function ForgotPassword() {
  const { logEvent } = useAnalytics();
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showConfirmationCta, setShowConfirmationCta] = useState(false);

  async function handleSubmit() {
    setFormError("");
    setShowConfirmationCta(false);
    if (!email.trim()) {
      setFormError("Введіть email");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      logEvent("forgot_password_requested");
      setSent(true);
      // Navigate to ResetPassword screen with email
      router.push({ pathname: "/ResetPassword", params: { email: email.trim().toLowerCase() } });
    } catch (e: any) {
      const errorMessage = formatErrorMessage(e);
      const isUnconfirmedEmailError = errorMessage.includes("Пошта не підтверджена");

      setFormError(
        isUnconfirmedEmailError
          ? "Ця пошта ще не підтверджена. Перейдіть до підтвердження акаунта і надішліть код повторно."
          : errorMessage,
      );
      setShowConfirmationCta(isUnconfirmedEmailError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      testID={ScreenIds.forgotPassword}
      accessibilityLabel={ScreenIds.forgotPassword}
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
          {/* Back button */}
          {/* <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Icon name="arrow-left" size={24} color="#1A1A1A" />
          </TouchableOpacity> */}

          <Button
            shape="round"
            hierarchy="tertiary"
            size="medium"
            leadingIcon={<Icon name="arrow-left" size={24} color={theme.colors.content.primary} />}
            onPress={() => router.back()}
            style={{ alignSelf: "flex-start" }}
            testId="auth:back:button"
          />

          {/* Header */}
          <View style={styles.header}>
            <Typography variant="h2" tone="primary">
              Забули пароль?
            </Typography>
            <Typography
              variant="body1"
              tone="secondary"
              style={{ textAlign: "center", marginTop: 16 }}
            >
              Введіть email, який ви використовували при реєстрації. Ми надішлемо вам код для
              скидання паролю.
            </Typography>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <TextField
                label="Email"
                placeholder="example@mail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                required
                errorMessage={formError || undefined}
                testId="auth:email:input"
              />
            </View>

            <View>
              <Button
                label={loading ? "Надсилання..." : "Надіслати код"}
                hierarchy="primary"
                shape="rectangle"
                size="medium"
                loading={loading}
                disabled={loading}
                onPress={handleSubmit}
                style={{ width: "100%" }}
                testId="auth:sendCode:button"
              />
            </View>

            {showConfirmationCta && (
              <View style={styles.secondaryAction}>
                <Button
                  label="Підтвердити пошту"
                  hierarchy="secondary"
                  shape="rectangle"
                  size="medium"
                  onPress={() =>
                    router.push({
                      pathname: "/PasswordSetup",
                      params: { email: email.trim().toLowerCase() },
                    })
                  }
                  style={{ width: "100%" }}
                  testId="auth:confirmEmail:button"
                />
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Typography variant="body2" tone="primary">
              Згадали пароль?{" "}
              <Typography
                variant="body2"
                tone="primary"
                weight="bold"
                onPress={() => router.back()}
              >
                Увійти
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
    paddingTop: theme.spacing[56],
    paddingBottom: theme.spacing[40],
  },
  backButton: {
    paddingBottom: theme.spacing[14],
    alignSelf: "flex-start",
  },
  header: {
    alignItems: "center",
  },

  formContainer: {
    marginTop: theme.spacing[32],
  },
  inputGroup: {
    marginBottom: theme.spacing[16],
  },
  footer: {
    alignItems: "center",
    gap: theme.spacing[16],
    marginTop: theme.spacing[24],
  },
  secondaryAction: {
    marginTop: theme.spacing[12],
  },
});
