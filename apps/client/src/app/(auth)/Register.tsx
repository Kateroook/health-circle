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
import { apiFetch } from "../../api/api";
import { formatErrorMessage } from "../../utils/error.util";

export default function Register() {
  const [form, setForm] = useState({
    phone: "",
    email: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) {
      const newErrors = { ...errors };
      delete newErrors[key];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // First Name validation
    if (!form.firstName.trim()) {
      newErrors.firstName = "Поле імені є обовʼязковим";
    } else if (form.firstName.length < 2) {
      newErrors.firstName = "Імʼя має містити не менше 2 символів";
    } else if (form.firstName.length > 50) {
      newErrors.firstName = "Імʼя має містити не більше 50 символів";
    }

    // Last Name validation
    if (!form.lastName.trim()) {
      newErrors.lastName = "Поле прізвища є обовʼязковим";
    } else if (form.lastName.length < 2) {
      newErrors.lastName = "Прізвище має містити не менше 2 символів";
    } else if (form.lastName.length > 50) {
      newErrors.lastName = "Прізвище має містити не більше 50 символів";
    }

    // Middle Name validation (optional)
    if (form.middleName.trim()) {
      if (form.middleName.length < 2) {
        newErrors.middleName = "По-батькові має містити не менше 2 символів";
      } else if (form.middleName.length > 50) {
        newErrors.middleName = "По-батькові має містити не більше 50 символів";
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = "Поле електронної пошти є обовʼязковим";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Некоректний формат електронної пошти";
    }

    // Phone validation
    const phoneRegex = /^\+380\d{9}$/;
    if (!form.phone.trim()) {
      newErrors.phone = "Поле номера телефону є обовʼязковим";
    } else if (!phoneRegex.test(form.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Некоректний формат номера телефону (+380...)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleRegister() {
    setFormError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          phone: form.phone.replace(/\s/g, ""), // Clean phone for API
        }),
      });
      router.push({
        pathname: "/PasswordSetup",
        params: { email: form.email },
      });
    } catch (e: any) {
      setFormError(formatErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    {
      key: "lastName",
      label: "Прізвище",
      placeholder: "Введіть прізвище",
      required: true,
    },
    {
      key: "firstName",
      label: "Ім'я",
      placeholder: "Введіть ім'я",
      required: true,
    },
    {
      key: "middleName",
      label: "По батькові",
      placeholder: "Введіть по батькові",
      required: false,
    },
    {
      key: "phone",
      label: "Телефон",
      placeholder: "+380 XX XXX XX XX",
      keyboardType: "phone-pad",
      required: true,
    },
    {
      key: "email",
      label: "Email",
      placeholder: "example@mail.com",
      keyboardType: "email-address",
      required: true,
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
            {fields.map(({ key, label, placeholder, keyboardType, required }) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={styles.label}>
                  {label}
                  {required && <Text style={styles.requiredStar}> *</Text>}
                </Text>
                <TextInput
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChangeText={(v) => handleChange(key, v)}
                  keyboardType={keyboardType as any}
                  style={[styles.input, errors[key] && styles.inputError]}
                  placeholderTextColor="#999"
                />
                {errors[key] && (
                  <Text style={styles.fieldError}>{errors[key]}</Text>
                )}
              </View>
            ))}

            {formError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{formError}</Text>
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
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Вже є акаунт?{" "}
            <Text
              style={styles.footerLink}
              onPress={() => router.push("/Login")}
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
  inputError: {
    borderColor: "#FF6B6B",
  },
  requiredStar: {
    color: "#FF6B6B",
  },
  fieldError: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 4,
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
