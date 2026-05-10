import { Button } from "@/src/components/Button";
import { PhoneInput } from "@/src/components/fields/PhoneInput";
import { TextField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { ScreenIds } from "@/src/utils/testIDs";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../api/api";
import { useAnalytics } from "../../hooks/useAnalytics";
import { useToast } from "../../hooks/useToast";
import { cleanObj } from "../../utils/clean.util";
import { formatErrorMessage } from "../../utils/error.util";

export default function Register() {
  const { showToast } = useToast();
  const { logEvent } = useAnalytics();

  useEffect(() => {
    logEvent("registration_started");
  }, []);

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
  const [validatedSteps, setValidatedSteps] = useState<Set<number>>(new Set());

  const [showLocationScreen, setShowLocationScreen] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

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
      const phoneRegex = /^\+[1-9]\d{6,14}$/;
      if (!cleanPhone) {
        newErrors.phone = "Поле номера телефону є обовʼязковим";
      } else if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = "Некоректний формат";
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!form.email.trim()) {
        newErrors.email = "Поле електронної пошти є обовʼязковим";
      } else if (!emailRegex.test(form.email)) {
        newErrors.email = "Некоректний формат електронної пошти";
      }
    }

    if (step === 2) {
      const trimmedLastName = form.lastName.trim();
      const trimmedFirstName = form.firstName.trim();

      if (!trimmedLastName) {
        newErrors.lastName = "Поле прізвища є обовʼязковим";
      } else if (trimmedLastName.length < 2) {
        newErrors.lastName = "Прізвище має містити не менше 2 символів";
      } else if (trimmedLastName.length > 50) {
        newErrors.lastName = "Прізвище має містити не більше 50 символів";
      }

      if (!trimmedFirstName) {
        newErrors.firstName = "Поле імені є обовʼязковим";
      } else if (trimmedFirstName.length < 2) {
        newErrors.firstName = "Імʼя має містити не менше 2 символів";
      } else if (trimmedFirstName.length > 50) {
        newErrors.firstName = "Імʼя має містити не більше 50 символів";
      }

      if (form.middleName.trim()) {
        if (form.middleName.length < 2) {
          newErrors.middleName = "По батькові має містити не менше 2 символів";
        } else if (form.middleName.length > 50) {
          newErrors.middleName = "По батькові має містити не більше 50 символів";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (): boolean => {
    if (step === 1) {
      const cleanPhone = form.phone.replace(/\s/g, "");
      const phoneRegex = /^\+[1-9]\d{6,14}$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return phoneRegex.test(cleanPhone) && emailRegex.test(form.email);
    }

    if (step === 2) {
      const trimmedLastName = form.lastName.trim();
      const trimmedFirstName = form.firstName.trim();
      const lastNameValid = trimmedLastName.length >= 2 && trimmedLastName.length <= 50;
      const firstNameValid = trimmedFirstName.length >= 2 && trimmedFirstName.length <= 50;
      const middleNameValid =
        !form.middleName.trim() || (form.middleName.length >= 2 && form.middleName.length <= 50);
      return lastNameValid && firstNameValid && middleNameValid;
    }

    return false;
  };

  const handleNext = async () => {
    setValidatedSteps((prev) => new Set([...prev, step]));
    const isValid = validateCurrentStep();
    if (isValid) {
      if (step === 1) {
        setLoading(true);
        try {
          const cleanPhone = form.phone.replace(/\s/g, "");
          const [phoneRes, emailRes] = await Promise.allSettled([
            apiFetch(`/auth/check-phone?phone=${encodeURIComponent(cleanPhone)}`),
            apiFetch(`/auth/check-email?email=${encodeURIComponent(form.email)}`),
          ]);

          let hasError = false;
          const newErrors: Record<string, string> = {};

          if (phoneRes.status === "rejected") {
            newErrors.phone =
              formatErrorMessage(phoneRes.reason) || "Номер телефону вже використовується";
            hasError = true;
          }
          if (emailRes.status === "rejected") {
            newErrors.email = formatErrorMessage(emailRes.reason) || "Email вже використовується";
            hasError = true;
          }

          if (hasError) {
            setErrors((prev) => ({ ...prev, ...newErrors }));
            setLoading(false);
            return;
          }

          logEvent("registration_step_2");
          setStep(2);
        } catch (e) {
          showToast({
            type: "error",
            title: "Помилка перевірки",
            subtitle: "Не вдалося перевірити дані. Спробуйте пізніше.",
          });
        } finally {
          setLoading(false);
        }
      } else {
        await handleRegister();
      }
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2) : prev));
  };

  async function handleRegister() {
    setValidatedSteps((prev) => new Set([...prev, 2]));
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
      setShowLocationScreen(true);
    } catch (e: any) {
      const errorMsg = formatErrorMessage(e);
      const isConflict =
        errorMsg.toLowerCase().includes("вже використовується") ||
        errorMsg.toLowerCase().includes("already exists");

      if (isConflict) setStep(1);

      showToast({
        type: "error",
        title: "Помилка реєстрації",
        subtitle: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleLocationAllow = () => {
    setLocationGranted(true);
    setShowLocationScreen(false);
    router.replace("/");
  };

  const handleLocationSkip = () => {
    setLocationGranted(false);
    setShowLocationScreen(false);
    router.replace("/");
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
  ) => (
    <>
      {isPhone ? (
        <PhoneInput
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize}
          required={required}
          errorMessage={error}
          testId={`auth:${isPhone ? "phone" : "email"}:input`}
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
          testId={`auth:${label === "Прізвище" ? "lastName" : label === "Ім'я" ? "firstName" : "middleName"}:input`}
        />
      )}
    </>
  );

  return (
    <SafeAreaView
      style={styles.safeArea}
      testID={ScreenIds.register}
      accessibilityLabel={ScreenIds.register}
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
              testId="auth:back:button"
            />
          )}

          <View style={styles.header}>
            <Typography variant="h2" tone="primary" style={styles.title}>
              {step === 1 ? "Введи номер телефону та електронну пошту" : "Як тебе звати?"}
            </Typography>
          </View>

          <View style={styles.formContainer}>
            {step === 1 && (
              <>
                <View style={styles.inputGroup}>
                  {renderInput(
                    "Номер телефону",
                    form.phone,
                    errors.phone,
                    "XX XXX XX XX",
                    "phone-pad",
                    (v) => handleChange("phone", v),
                    "words",
                    15,
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

            <View style={styles.buttonsContainer}>
              <Button
                label={loading ? "Зачекайте..." : "Далі"}
                hierarchy="primary"
                shape="rectangle"
                size="medium"
                loading={loading}
                disabled={loading || !isStepValid()}
                onPress={handleNext}
                style={{ width: "100%" }}
                testId="auth:next:button"
              />
            </View>
          </View>

          <Typography variant="body2" tone="primary" style={styles.footer}>
            Вже є акаунт?{" "}
            <Typography
              variant="body2"
              tone="primary"
              weight="bold"
              testId="auth:login:link"
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
  footer: {
    textAlign: "center",
    marginTop: theme.spacing[16],
  },
});
