import { Button } from "@/src/components/Button";
import { TextField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { showMessage } from "react-native-flash-message";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { apiFetch } from "../../api/api";
import { cleanObj } from "../../utils/clean.util";
import { formatErrorMessage } from "../../utils/error.util";
export default function Register() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    phone: "",
    email: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
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
        newErrors.lastName = "Прізвище має містити не менше 2 символів";
      } else if (form.lastName.length > 50) {
        newErrors.lastName = "Прізвище має містити не більше 50 символів";
      }

      if (!form.firstName.trim()) {
        newErrors.firstName = "Поле імені є обовʼязковим";
      } else if (form.firstName.length < 2) {
        newErrors.firstName = "Імʼя має містити не менше 2 символів";
      } else if (form.firstName.length > 50) {
        newErrors.firstName = "Імʼя має містити не більше 50 символів";
      }

      if (form.middleName.trim()) {
        if (form.middleName.length < 2) {
          newErrors.middleName = "По-батькові має містити не менше 2 символів";
        } else if (form.middleName.length > 50) {
          newErrors.middleName = "По-батькові має містити не більше 50 символів";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    // Позначаємо, що цей крок вже валідувався
    setValidatedSteps((prev) => new Set([...prev, step]));

    const isValid = validateCurrentStep();

    if (isValid) {
      if (step === 1) {
        setStep(2);
      } else {
        await handleRegister();
      }
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2) : prev));
  };

  const renderInput = (
    label: string,
    value: string,
    error: string | undefined,
    placeholder: string,
    keyboardType: "phone-pad" | "email-address" | "default" = "default",
    onChangeText: (text: string) => void,
    autoCapitalize: "none" | "words" = "words",
    maxLength?: number,
    isPhone?: boolean,
    required?: boolean,
  ) => {
    return (
      <>
        {isPhone ? (
          <TextField
            label={label}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            required={required}
            errorMessage={error}
          />
        ) : (
          <TextField
            label={label}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            required={required}
            errorMessage={error}
          />
        )}
      </>
    );
  };

  async function handleRegister() {
    setValidatedSteps((prev) => new Set([...prev, 2])); // позначаємо останній крок
    if (!validateCurrentStep()) return;

    setLoading(true);
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(
          cleanObj({
            ...form,
            phone: form.phone.replace(/\s/g, ""),
          }),
        ),
      });
      router.replace({ pathname: "/PasswordSetup", params: { email: form.email } });
    } catch (e: any) {
      const errorMsg = formatErrorMessage(e);
      const isConflict =
        errorMsg.toLowerCase().includes("вже використовується") ||
        errorMsg.toLowerCase().includes("already exists");

      if (isConflict) {
        setStep(1);
      }

      showMessage({
        message: "Помилка реєстрації",
        description: errorMsg,
        type: "danger",
        duration: 5000,
      });
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
          {step > 1 && (
            <Button
              shape="round"
              hierarchy="tertiary"
              size="medium"
              leadingIcon={
                <Icon name="arrow-left" size={24} color={theme.colors.content.primary} />
              }
              onPress={handleBack}
              style={{ alignSelf: "flex-start" }}
            />
          )}
          {/* Header */}
          <View style={styles.header}>
            <Typography variant="h2" tone="primary" style={styles.title}>
              {step === 1 ? "Введи номер телефону та електронну пошту" : "Як тебе звати?"}
            </Typography>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {step === 1 && (
              <>
                <View style={styles.inputGroup}>
                  {renderInput(
                    "Номер телефону",
                    form.phone,
                    errors.phone,
                    "+380 XX XXX XX XX",
                    "phone-pad",
                    (v) => handleChange("phone", v),
                    "words",
                    13,
                    true,
                    true,
                  )}
                </View>

                <View style={styles.inputGroup}>
                  {renderInput(
                    "Електронна пошта",
                    form.email,
                    errors.email,
                    "example@mail.com",
                    "email-address",
                    (v) => handleChange("email", v),
                    "none",
                    100,
                    false,
                    true,
                  )}
                </View>
              </>
            )}

            {step === 2 && (
              <>
                <View style={styles.inputGroup}>
                  {renderInput(
                    "Прізвище",
                    form.lastName,
                    errors.lastName,
                    "Введіть прізвище",
                    "default",
                    (v) => handleChange("lastName", v),
                    "words",
                    50,
                    false,
                    true,
                  )}
                </View>

                <View style={styles.inputGroup}>
                  {renderInput(
                    "Ім'я",
                    form.firstName,
                    errors.firstName,
                    "Введіть ім'я",
                    "default",
                    (v) => handleChange("firstName", v),
                    "words",
                    50,
                    false,
                    true,
                  )}
                </View>

                <View style={styles.inputGroup}>
                  {renderInput(
                    "По батькові",
                    form.middleName,
                    errors.middleName,
                    "Введіть по батькові (опціонально)",
                    "default",
                    (v) => handleChange("middleName", v),
                    "words",
                    50,
                    false,
                    false,
                  )}
                </View>
              </>
            )}

            {/* Removed redundant step 3 password fields */}

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <Button
                label={loading ? "Зачекайте..." : step < 2 ? "Далі" : "Зареєструватися"}
                hierarchy="primary"
                shape="rectangle"
                size="medium"
                loading={loading}
                disabled={loading}
                onPress={handleNext}
                style={{ width: "100%" }}
              />
            </View>
          </View>

          {/* Footer */}
          <Typography variant="body2" tone="primary" style={styles.footer}>
            Вже є акаунт?{" "}
            <Typography
              variant="body2"
              tone="primary"
              weight="bold"
              onPress={() => router.push("/Login")}
            >
              Увійти
            </Typography>
          </Typography>
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
  header: {
    alignItems: "center",
    marginBottom: theme.spacing[32],
  },
  title: {
    textAlign: "center",
  },
  formContainer: {
    marginBottom: theme.spacing[16],
  },
  inputGroup: {
    marginBottom: theme.spacing[16],
  },

  buttonsContainer: {
    paddingTop: theme.spacing[8],
    gap: theme.spacing[16],
  },

  primaryButton: {
    backgroundColor: theme.colors.primaryB,
    paddingVertical: theme.spacing[16],
    borderRadius: theme.radius.pill,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: theme.spacing[8],
    elevation: theme.spacing[4],
  },

  buttonDisabled: {
    backgroundColor: theme.colors.primaryB,
    opacity: 0.7,
  },

  backButton: {
    paddingVertical: theme.spacing[12],
    alignItems: "center",
  },

  footer: {
    textAlign: "center",
    marginTop: theme.spacing[16],
  },
});
