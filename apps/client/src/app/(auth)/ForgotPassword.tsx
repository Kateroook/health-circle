import { Button } from "@/src/components/Button";
import { TextField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { apiFetch } from "../../api/api";
import { formatErrorMessage } from "../../utils/error.util";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setFormError("");
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
      setSent(true);
      // Navigate to ResetPassword screen with email
      router.push({ pathname: "/ResetPassword", params: { email: email.trim().toLowerCase() } });
    } catch (e: any) {
      setFormError(formatErrorMessage(e));
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
              />
            </View>
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
});
