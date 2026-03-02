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
import { showMessage } from "react-native-flash-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../api/api";
import { formatErrorMessage } from "../../utils/error.util";

export default function Register() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    phone: "",
    email: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Відстежуємо, які кроки вже пройшли валідацію (щоб показувати індикатори помилок)
  const [validatedSteps, setValidatedSteps] = useState<Set<number>>(new Set());

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      const cleanPhone = form.phone.replace(/\s/g, "");
      const phoneRegex = /^\+380\d{9}$/;
      if (!cleanPhone) {
        newErrors.phone = "Поле номера телефону є обовʼязковим";
      } else if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = "Формат: +380XXXXXXXXX";
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!form.email.trim()) {
        newErrors.email = "Поле електронної пошти є обовʼязковим";
      } else if (!emailRegex.test(form.email)) {
        newErrors.email = "Некоректний формат електронної пошти";
      }
    }

    if (step === 2) {
      if (!form.lastName.trim()) {
        newErrors.lastName = "Поле прізвища є обовʼязковим";
      } else if (form.lastName.length < 2) {
        newErrors.lastName = "Мінімум 2 символи";
      }

      if (!form.firstName.trim()) {
        newErrors.firstName = "Поле імені є обовʼязковим";
      } else if (form.firstName.length < 2) {
        newErrors.firstName = "Мінімум 2 символи";
      }

      if (form.middleName.trim() && form.middleName.length < 2) {
        newErrors.middleName = "Мінімум 2 символи";
      }
    }

    if (step === 3) {
      if (!password) {
        newErrors.password = "Введіть пароль";
      } else if (password.length < 8) {
        newErrors.password = "Мінімум 8 символів";
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Підтвердіть пароль";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Паролі не співпадають";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Позначаємо, що цей крок вже валідувався
    setValidatedSteps((prev) => new Set([...prev, step]));

    const isValid = validateCurrentStep();

    if (isValid) {
      setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  async function handleRegister() {
    setValidatedSteps((prev) => new Set([...prev, 3])); // позначаємо останній крок
    if (!validateCurrentStep()) return;

    setLoading(true);
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          phone: form.phone.replace(/\s/g, ""),
          password,
        }),
      });
      router.replace("/Login");
    } catch (e: any) {
      showMessage({
        message: "Помилка реєстрації",
        description: formatErrorMessage(e),
        type: "danger",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  const renderInput = (
    value: string,
    error: string | undefined,
    placeholder: string,
    keyboardType: "phone-pad" | "email-address" | "default" = "default",
    secureTextEntry = false,
    onChangeText: (text: string) => void,
    autoCapitalize: "none" | "words" = "words",
  ) => {
    const hasBeenValidated = validatedSteps.has(step);
    const isFilled = value.trim().length > 0;
    const hasError = !!error;

    let indicatorStyle = null;
    let symbol = null;

    if (hasBeenValidated) {
      if (hasError) {
        indicatorStyle = styles.statusError;
        symbol = "!";
      } else if (isFilled) {
        indicatorStyle = styles.statusSuccess;
        symbol = "✓";
      }
    }

    return (
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            hasError ? styles.inputError : isFilled && !hasError ? styles.inputValid : null,
          ]}
          placeholderTextColor="#999"
        />

        {indicatorStyle && (
          <View style={[styles.statusIndicator, indicatorStyle]}>
            <Text style={styles.statusSymbol}>{symbol}</Text>
          </View>
        )}
      </View>
    );
  };

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
            <Text style={styles.title}>
              {step === 1
                ? "Введи номер телефону та електронну пошту"
                : step === 2
                  ? "Як тебе звати?"
                  : "Створюємо твій акаунт"}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {step === 1 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Номер телефону</Text>
                  {renderInput(
                    form.phone,
                    errors.phone,
                    "+380 XX XXX XX XX",
                    "phone-pad",
                    false,
                    (v) => handleChange("phone", v),
                    "words",
                  )}
                  {errors.phone && <Text style={styles.fieldError}>{errors.phone}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Електронна пошта</Text>
                  {renderInput(
                    form.email,
                    errors.email,
                    "example@mail.com",
                    "email-address",
                    false,
                    (v) => handleChange("email", v),
                    "none",
                  )}
                  {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Прізвище</Text>
                  {renderInput(
                    form.lastName,
                    errors.lastName,
                    "Введіть прізвище",
                    "default",
                    false,
                    (v) => handleChange("lastName", v),
                  )}
                  {errors.lastName && <Text style={styles.fieldError}>{errors.lastName}</Text>}
                </View>

                <View style={styles.inputGroup}>
                                  <Text style={styles.label}>{"Ім'я"}</Text>
                  {renderInput(
                    form.firstName,
                    errors.firstName,
                    "Введіть ім'я",
                    "default",
                    false,
                    (v) => handleChange("firstName", v),
                  )}
                  {errors.firstName && <Text style={styles.fieldError}>{errors.firstName}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>По батькові</Text>
                  {renderInput(
                    form.middleName,
                    errors.middleName,
                    "Введіть по батькові (опціонально)",
                    "default",
                    false,
                    (v) => handleChange("middleName", v),
                  )}
                  {errors.middleName && <Text style={styles.fieldError}>{errors.middleName}</Text>}
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Пароль</Text>
                  {renderInput(
                    password,
                    errors.password,
                    "Мінімум 8 символів",
                    "default",
                    true,
                    setPassword,
                  )}
                  {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Підтвердіть пароль</Text>
                  {renderInput(
                    confirmPassword,
                    errors.confirmPassword,
                    "Повторіть пароль",
                    "default",
                    true,
                    setConfirmPassword,
                  )}
                  {errors.confirmPassword && (
                    <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
                  )}
                </View>
              </>
            )}

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={step < 3 ? handleNext : handleRegister}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Зачекайте..." : step < 3 ? "Далі" : "Зареєструватися"}
                </Text>
              </TouchableOpacity>

              {step > 1 && (
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Text style={styles.backButtonText}>Назад</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Вже є акаунт?{" "}
            <Text style={styles.footerLink} onPress={() => router.push("/Login")}>
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
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

  inputWrapper: {
    position: "relative",
  },

  input: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 48,
    borderRadius: 10,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  inputError: {
    borderColor: "#FF6B6B",
  },

  inputValid: {
    borderColor: "#4CAF50",
  },

  statusIndicator: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  statusSuccess: {
    backgroundColor: "#4CAF50",
  },

  statusError: {
    backgroundColor: "#FF6B6B",
  },

  statusSymbol: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: 20,
  },

  fieldError: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  buttonsContainer: {
    marginTop: 16,
    gap: 12,
  },

  primaryButton: {
    backgroundColor: "#000000",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
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

  backButton: {
    paddingVertical: 12,
    alignItems: "center",
  },

  backButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },

  footer: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginTop: 24,
    marginBottom: 20,
  },

  footerLink: {
    color: "#000000",
    fontWeight: "600",
  },
});
