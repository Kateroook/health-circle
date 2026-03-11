import { Button } from "@/src/components/Button";
import { PasswordField, TextField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { useAuthStore } from "@/src/store/authStore";
import { theme } from "@/src/theme/theme";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { formatErrorMessage } from "../../utils/error.util";
export default function Login() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleLogin() {
    setFormError("");
    setHasError(false);
    setLoading(true);
    try {
      // Clean phone number if it looks like one (simple trim/format logic if needed)
      const cleanIdentifier = email.trim();
      await login(cleanIdentifier, password);
      router.replace("/Dashboard");
    } catch (e: any) {
      const errorMsg = formatErrorMessage(e);
      if (errorMsg === "INCOMPLETE_REGISTRATION") {
        router.push({ pathname: "/PasswordSetup", params: { email } });
        return;
      }
      setFormError(errorMsg);
      setHasError(true);
    } finally {
      setLoading(false);
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
          {/* Header */}
          <View style={styles.header}>
            <Typography variant="h2" tone="primary">
              З поверненням!
            </Typography>
            <Typography variant="body1" tone="secondary">
              Ми раді бачити тебе знову в Колі!
            </Typography>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <TextField
                label="Електронна пошта або телефон"
                placeholder="example@mail.com або +380..."
                value={email}
                onChangeText={setEmail}
                keyboardType="default"
                autoCapitalize="none"
                required
                errorMessage={hasError ? formError : undefined}
              />
            </View>

            <View style={styles.inputGroup}>
              <PasswordField
                label="Пароль"
                placeholder="Введіть пароль"
                value={password}
                onChangeText={setPassword}
                required
              />
            </View>

            {formError && !hasError && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={18} color="#D32F2F" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <Button
                label={loading ? "Вхід..." : "Увійти"}
                hierarchy="primary"
                shape="rectangle"
                size="medium"
                loading={loading}
                disabled={loading}
                onPress={handleLogin}
                style={{ width: "100%" }}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Typography variant="body2" tone="primary">
              Забули пароль?{" "}
              <Typography
                variant="body2"
                tone="primary"
                weight="bold"
                onPress={() => router.push("/ForgotPassword")}
              >
                Скинути
              </Typography>
            </Typography>
            <Typography variant="body2" tone="primary">
              Ще немає акаунту?{" "}
              <Typography
                variant="body2"
                tone="primary"
                weight="bold"
                onPress={() => router.push("/Register")}
              >
                Зареєструватися
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
    paddingTop: theme.spacing[104],
    paddingBottom: theme.spacing[40],
  },
  header: {
    alignItems: "center",
    marginTop: theme.spacing[10],
    gap: theme.spacing[8],
  },

  formContainer: {
    paddingTop: theme.spacing[32],
  },
  inputGroup: {
    marginBottom: theme.spacing[16],
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.lightNegative,
    padding: theme.spacing[16],
    borderRadius: theme.radius.lg,
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

  footer: {
    alignItems: "center",
    gap: theme.spacing[16],
    marginTop: theme.spacing[24],
  },
});
