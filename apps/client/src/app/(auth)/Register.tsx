import { COLORS } from "@/src/theme/colors";
import { AntDesign } from "@expo/vector-icons";
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
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../api/api";
import { formatErrorMessage } from "../../utils/error.util";

export const COUNTRY_PREFIXES = [
  { code: "+380", label: "🇺🇦 Україна (+380)" },
  { code: "+48", label: "🇵🇱 Польща (+48)" },
  { code: "+49", label: "🇩🇪 Німеччина (+49)" },
  { code: "+44", label: "🇬🇧 Велика Британія (+44)" },
  { code: "+1", label: "🇺🇸 США/Канада (+1)" },
  { code: "+420", label: "🇨🇿 Чехія (+420)" },
  { code: "+421", label: "🇸🇰 Словаччина (+421)" },
  { code: "+40", label: "🇷🇴 Румунія (+40)" },
];

export default function Register() {
  const [form, setForm] = useState({
    phone: "",
    email: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [phonePrefix, setPhonePrefix] = useState("+380");
  const [isPrefixModalVisible, setIsPrefixModalVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    // Прізвище
    if (!form.lastName.trim()) {
      newErrors.lastName = "Поле прізвища є обовʼязковим";
    } else if (form.lastName.length < 2) {
      newErrors.lastName = "Прізвище має містити не менше 2 символів";
    } else if (form.lastName.length > 50) {
      newErrors.lastName = "Прізвище має містити не більше 50 символів";
    }

    // Ім'я
    if (!form.firstName.trim()) {
      newErrors.firstName = "Поле імені є обовʼязковим";
    } else if (form.firstName.length < 2) {
      newErrors.firstName = "Імʼя має містити не менше 2 символів";
    } else if (form.firstName.length > 50) {
      newErrors.firstName = "Імʼя має містити не більше 50 символів";
    }

    // По батькові — обов'язкове
    if (!form.middleName.trim()) {
      newErrors.middleName = "Поле по батькові є обовʼязковим";
    } else if (form.middleName.length < 2) {
      newErrors.middleName = "По-батькові має містити не менше 2 символів";
    } else if (form.middleName.length > 50) {
      newErrors.middleName = "По-батькові має містити не більше 50 символів";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = "Поле електронної пошти є обовʼязковим";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Некоректний формат електронної пошти";
    }

    // Телефон (просто від 7 до 15 цифр після префікса)
    const phoneBodyRegex = /^\d{7,15}$/;
    const cleanPhone = form.phone.replace(/\s/g, "").replace(/\D/g, "");
    if (!cleanPhone) {
      newErrors.phone = "Поле номера телефону є обовʼязковим";
    } else if (!phoneBodyRegex.test(cleanPhone)) {
      newErrors.phone = "Некоректний формат номера телефону";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleRegister() {
    setGeneralError(null);
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    const fullPhoneNumber = phonePrefix + form.phone.replace(/\D/g, "");

    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          phone: fullPhoneNumber,
        }),
      });

      router.push({
        pathname: "/PasswordSetup",
        params: { email: form.email },
      });
    } catch (e: any) {
      console.log("SERVER ERROR DEBUG:", e);

      const newServerErrors: Record<string, string> = {};
      let errorData: any = null;

      if (typeof e.message === "string") {
        try {
          errorData = JSON.parse(e.message);
        } catch {}
      }

      if (!errorData && e?.response?.data) {
        errorData = e.response.data;
      }

      if (errorData && typeof errorData === "object" && Array.isArray(errorData.message)) {
        const messages = errorData.message;

        messages.forEach((msg: string) => {
          const lowerMsg = msg.toLowerCase();

          if (
            lowerMsg.includes("електрон") ||
            lowerMsg.includes("пошт") ||
            lowerMsg.includes("email")
          ) {
            newServerErrors.email = msg;
          } else if (
            lowerMsg.includes("телефон") ||
            lowerMsg.includes("номер") ||
            lowerMsg.includes("phone")
          ) {
            newServerErrors.phone = msg;
          } else {
            newServerErrors.general = (newServerErrors.general || "") + msg + "\n";
          }
        });

        if (Object.keys(newServerErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...newServerErrors }));
          return;
        }
      }

      showMessage({
        message: "Помилка реєстрації",
        description: formatErrorMessage(e) || "Щось пішло не так",
        type: "danger",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "lastName", label: "Прізвище", placeholder: "Введіть прізвище", required: true },
    { key: "firstName", label: "Ім'я", placeholder: "Введіть ім'я", required: true },
    { key: "middleName", label: "По батькові", placeholder: "Введіть по батькові", required: true },
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
            <Text style={styles.subtitle}>Заповніть дані, щоб приєднатися до кола турботи</Text>
          </View>

          {generalError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>!</Text>
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          )}

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
                {errors[key] && <Text style={styles.fieldError}>{errors[key]}</Text>}
              </View>
            ))}

            {/* Phone Input with Prefix Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Телефон <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={[styles.phoneWrapper, errors.phone && styles.inputError]}>
                <TouchableOpacity
                  style={styles.prefixButton}
                  onPress={() => setIsPrefixModalVisible(true)}
                >
                  <Text style={styles.prefixText}>{phonePrefix}</Text>
                  <AntDesign name="down" size={12} color="#666" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="XX XXX XX XX"
                  value={form.phone}
                  onChangeText={(v) => handleChange("phone", v)}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>
              {errors.phone && <Text style={styles.fieldError}>{errors.phone}</Text>}
            </View>

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

          <Text style={styles.footer}>
            Вже є акаунт?{" "}
            <Text style={styles.footerLink} onPress={() => router.push("/Login")}>
              Увійти
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Prefix Selection Modal */}
      <Modal
        isVisible={isPrefixModalVisible}
        onBackdropPress={() => setIsPrefixModalVisible(false)}
        onBackButtonPress={() => setIsPrefixModalVisible(false)}
        swipeDirection="down"
        onSwipeComplete={() => setIsPrefixModalVisible(false)}
        style={styles.bottomModal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Виберіть код країни</Text>
          <ScrollView style={styles.prefixList}>
            {COUNTRY_PREFIXES.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={styles.prefixListItem}
                onPress={() => {
                  setPhonePrefix(item.code);
                  setIsPrefixModalVisible(false);
                }}
              >
                <Text style={styles.prefixListLabel}>{item.label}</Text>
                {phonePrefix === item.code && (
                  <AntDesign name="check" size={20} color={COLORS.PRIMARY_BLUE} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: { alignItems: "center", marginBottom: 32 },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E8F5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: { fontSize: 36 },
  title: { fontSize: 28, fontWeight: "700", color: "#1A1A1A", marginBottom: 8 },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  formContainer: { marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
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
  phoneWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",
  },
  prefixButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
  },
  prefixText: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1A1A1A",
  },
  inputError: { borderColor: "#FF6B6B" },
  requiredStar: { color: "#FF6B6B" },
  fieldError: { color: "#FF6B6B", fontSize: 12, marginTop: 4, marginLeft: 4 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  errorIcon: { fontSize: 24, color: "#D32F2F", marginRight: 12 },
  errorText: { color: "#D32F2F", fontSize: 15, lineHeight: 22, flex: 1 },
  buttonsContainer: { marginTop: 8, gap: 12 },
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
  buttonDisabled: { backgroundColor: "#FFB3B3", opacity: 0.7 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  footer: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginTop: 16,
    marginBottom: 20,
  },
  footerLink: { color: "#FF6B6B", fontWeight: "600" },

  // Modal styles
  bottomModal: { justifyContent: "flex-end", margin: 0 },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "60%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DDD",
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  prefixList: { flexGrow: 0 },
  prefixListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  prefixListLabel: { fontSize: 16, color: "#1A1A1A" },
});
