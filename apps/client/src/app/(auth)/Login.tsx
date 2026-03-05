import { useAuthStore } from "@/src/store/authStore";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { formatErrorMessage } from "../../utils/error.util";

export default function Login() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasFailedAttempt, setHasFailedAttempt] = useState(false);
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
      setHasFailedAttempt(true);
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
            <Text style={styles.title}>З поверненням!</Text>
            <Text style={styles.subtitle}>Ми раді бачити тебе знову в Колі!</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Електронна пошта або телефон</Text>
              <TextInput
                placeholder="example@mail.com або +380..."
                value={email}
                onChangeText={setEmail}
                keyboardType="default"
                autoCapitalize="none"
                style={[styles.input, hasError && styles.inputError]}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Пароль</Text>
              <View style={[styles.passwordContainer, hasError && styles.passwordContainerError]}>
                <TextInput
                  placeholder="Введіть пароль"
                  value={password}
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  style={styles.passwordInput}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
                </TouchableOpacity>
              </View>
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
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>{loading ? "Вхід..." : "Увійти"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Забули пароль?{" "}
              <Text style={styles.footerLink} onPress={() => router.push("/ForgotPassword")}>
                Скинути
              </Text>
            </Text>
            <Text style={styles.footerText}>
              Ще немає акаунту?{" "}
              <Text style={styles.footerLink} onPress={() => router.push("/Register")}>
                Зареєструватися
              </Text>
            </Text>
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
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 10,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF4E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
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
    marginTop: 10,
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
  inputError: {
    // ← окремий стиль для помилки
    borderColor: "#D32F2F",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  passwordContainerError: {
    borderColor: "#D32F2F",
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
  buttonsContainer: {
    marginTop: 8,
    gap: 12,
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
  buttonDisabled: {
    backgroundColor: "#000000",
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    gap: 16,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#000000",
  },
  footerLink: {
    color: "#000000",
    fontWeight: "600",
  },
  forgotPasswordText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "500",
  },
});
