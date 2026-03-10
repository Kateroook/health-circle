import { AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ModalNative from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ConfirmationModal from "../../components/ConfirmationModal";

import { COLORS } from "@/src/theme/colors";
import { apiFetch, apiUploadFile, getAvatarUrl } from "../../api/api";
import { useAuthStore } from "../../store/authStore";
import { cleanObj } from "../../utils/clean.util";
import { formatErrorMessage } from "../../utils/error.util";

import { COUNTRY_PREFIXES } from "../(auth)/Register";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [fullName, setFullName] = useState(user?.fullName || "");

  // Розбиваємо телефон на префікс і тіло
  const [phonePrefix, setPhonePrefix] = useState("+380");
  const [phoneBody, setPhoneBody] = useState("");
  const [isPrefixModalVisible, setIsPrefixModalVisible] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const defaultAvatar = require("../../assets/images/default-avatar.png");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isDeleteAccountVisible, setIsDeleteAccountVisible] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const [isDeleteAvatarVisible, setIsDeleteAvatarVisible] = useState(false);

  useEffect(() => {
    if (user?.id) setAvatarUrl(getAvatarUrl(user.id, user.avatarUpdatedAt));

    // Спроба розпізнати префікс з існуючого телефону
    if (user?.phone) {
      const matchedPrefix = COUNTRY_PREFIXES.find((p) => user.phone.startsWith(p.code));
      if (matchedPrefix) {
        setPhonePrefix(matchedPrefix.code);
        setPhoneBody(user.phone.slice(matchedPrefix.code.length));
      } else {
        setPhoneBody(user.phone);
      }
    }
  }, [user]);

  const validate = () => {
    const errors: string[] = [];
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedMiddle = middleName.trim();
    const trimmedPhoneBody = phoneBody.trim();

    if (!trimmedFirst || trimmedFirst.length < 2) {
      errors.push("Імʼя має містити не менше 2 символів");
    } else if (trimmedFirst.length > 50) {
      errors.push("Імʼя має містити не більше 50 символів");
    }

    if (!trimmedLast || trimmedLast.length < 2) {
      errors.push("Прізвище має містити не менше 2 символів");
    } else if (trimmedLast.length > 50) {
      errors.push("Прізвище має містити не більше 50 символів");
    }

    if (!trimmedMiddle || trimmedMiddle.length < 2) {
      errors.push("По-батькові має містити не менше 2 символів");
    } else if (trimmedMiddle.length > 50) {
      errors.push("По-батькові має містити не більше 50 символів");
    }

    const trimmedFullName = fullName.trim();
    if (!trimmedMiddle) errors.push("Не можна зберегти порожнє повне імʼя");
    else if (trimmedFullName.length > 255) {
      errors.push("Повне імʼя має містити не більше 255 символів");
    }

    if (!trimmedPhoneBody) {
      errors.push("Номер телефону є обовʼязковим");
    } else if (!/^\d{7,15}$/.test(trimmedPhoneBody.replace(/\D/g, ""))) {
      errors.push("Некоректний формат номера телефону");
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validate();
    if (errors.length > 0) {
      Alert.alert("Помилка", errors.join("\n"));
      return;
    }

    const fullPhoneNumber = phonePrefix + phoneBody.replace(/\D/g, "");

    try {
      await apiFetch("/users", {
        method: "PUT",
        body: JSON.stringify(
          cleanObj({
            id: user?.id,
            firstName: firstName.trim(),
            middleName: middleName.trim(),
            lastName: lastName.trim(),
            fullName: fullName.trim(),
            phone: fullPhoneNumber,
            email: user?.email,
          }),
        ),
      });
      Alert.alert("Успіх", "Дані оновлено");
      await refreshProfile();
    } catch (e: any) {
      Alert.alert("Помилка", e?.message || "Не вдалося оновити дані");
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split("/").pop()!;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image";

      try {
        const response = await apiUploadFile(`/users/${user?.id}/avatar`, {
          uri: localUri,
          name: filename,
          type,
        });

        if (response && response.avatarUpdatedAt) {
          updateUser({ avatarUpdatedAt: response.avatarUpdatedAt });
        }

        await refreshProfile();
        Alert.alert("Успіх", "Аватар оновлено");
      } catch (e: any) {
        Alert.alert("Помилка", e?.message || "Не вдалося оновити аватар");
      }
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!oldPassword.trim()) {
      setPasswordError("Введіть поточний пароль");
      return;
    }
    if (!newPassword.trim() || newPassword.length < 12) {
      setPasswordError("Новий пароль має містити щонайменше 12 символів");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Новий пароль та підтвердження не співпадають");
      return;
    }
    setPasswordLoading(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          oldPassword: oldPassword.trim(),
          newPassword: newPassword.trim(),
          confirmNewPassword: confirmPassword.trim(),
        }),
      });
      Alert.alert("Успіх", "Пароль успішно змінено");
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setPasswordError(formatErrorMessage(e, "Не вдалося змінити пароль"));
    } finally {
      setPasswordLoading(false);
    }
  };

  const fields = [
    {
      label: "Прізвище",
      value: lastName,
      setter: setLastName,
      placeholder: "Введіть прізвище",
      maxLength: 50,
      required: true,
    },
    {
      label: "Імʼя",
      value: firstName,
      setter: setFirstName,
      placeholder: "Введіть імʼя",
      maxLength: 50,
      required: true,
    },
    {
      label: "По-батькові",
      value: middleName,
      setter: setMiddleName,
      placeholder: "Введіть по-батькові",
      maxLength: 50,
      required: true,
    },
    {
      label: "Відображаєме імʼя",
      value: fullName,
      setter: setFullName,
      placeholder: "Введіть відображаєме імʼя",
      maxLength: 255,
      required: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Налаштування</Text>

          <Image
            source={!imageError && avatarUrl ? { uri: avatarUrl } : defaultAvatar}
            style={styles.avatar}
            onError={() => setImageError(true)}
          />

          <View style={styles.avatarButtons}>
            <TouchableOpacity style={styles.avatarButton} onPress={handlePickAvatar}>
              <Text style={styles.avatarButtonText}>Змінити аватар</Text>
            </TouchableOpacity>
            {avatarUrl && !imageError && (
              <TouchableOpacity
                style={[styles.avatarButton, styles.removeButton]}
                onPress={() => setIsDeleteAvatarVisible(true)}
              >
                <Text style={styles.avatarButtonText}>Видалити аватар</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {fields.map((field) => (
          <View key={field.label} style={styles.block}>
            <Text style={styles.label}>
              {field.label}
              {field.required && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.setter}
              placeholder={field.placeholder}
              placeholderTextColor="#999"
              maxLength={field.maxLength}
            />
          </View>
        ))}

        <View style={styles.block}>
          <Text style={styles.label}>
            Номер телефону <Text style={styles.requiredStar}> *</Text>
          </Text>
          <View style={styles.phoneWrapper}>
            <TouchableOpacity
              style={styles.prefixButton}
              onPress={() => setIsPrefixModalVisible(true)}
            >
              <Text style={styles.prefixText}>{phonePrefix}</Text>
              <AntDesign name="down" size={12} color="#666" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              value={phoneBody}
              onChangeText={setPhoneBody}
              placeholder="XX XXX XX XX"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.save} onPress={handleSave}>
          <Text style={styles.saveText}>Зберегти</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.changePassword} onPress={() => setShowPasswordModal(true)}>
          <Text style={styles.changePasswordText}>Змінити пароль</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout} onPress={() => setIsLogoutVisible(true)}>
          <Text style={styles.logoutText}>Вийти</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.delete} onPress={() => setIsDeleteAccountVisible(true)}>
          <Text style={styles.deleteText}>Видалити акаунт</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Змінити пароль</Text>

            <View style={styles.modalPasswordContainer}>
              <TextInput
                style={styles.modalPasswordInput}
                placeholder="Поточний пароль"
                placeholderTextColor="#999"
                secureTextEntry={!showOldPassword}
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <TouchableOpacity
                onPress={() => setShowOldPassword(!showOldPassword)}
                style={styles.eyeButton}
              >
                <Icon name={showOldPassword ? "eye-off" : "eye"} size={20} color="#999" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalPasswordContainer}>
              <TextInput
                style={styles.modalPasswordInput}
                placeholder="Новий пароль (мін. 12 символів)"
                placeholderTextColor="#999"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <Icon name={showNewPassword ? "eye-off" : "eye"} size={20} color="#999" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalPasswordContainer}>
              <TextInput
                style={styles.modalPasswordInput}
                placeholder="Підтвердити новий пароль"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {passwordError ? <Text style={styles.modalError}>{passwordError}</Text> : null}

            <TouchableOpacity
              style={[styles.modalSave, passwordLoading && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={passwordLoading}
            >
              <Text style={styles.modalSaveText}>
                {passwordLoading ? "Збереження..." : "Змінити пароль"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setShowPasswordModal(false);
                setPasswordError("");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              <Text style={styles.modalCancelText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Prefix Selection Modal */}
      <ModalNative
        isVisible={isPrefixModalVisible}
        onBackdropPress={() => setIsPrefixModalVisible(false)}
        onBackButtonPress={() => setIsPrefixModalVisible(false)}
        swipeDirection="down"
        onSwipeComplete={() => setIsPrefixModalVisible(false)}
        style={styles.bottomModal}
      >
        <View style={styles.prefixModalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.prefixModalTitle}>Виберіть код країни</Text>
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
      </ModalNative>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isVisible={isDeleteAccountVisible}
        onCancel={() => setIsDeleteAccountVisible(false)}
        onConfirm={async () => {
          setIsDeleteAccountVisible(false);
          try {
            await apiFetch("/users", { method: "DELETE" });
            logout();
          } catch (e) {
            Alert.alert("Помилка", "Не вдалося видалити акаунт");
          }
        }}
        title="Видалити акаунт?"
        message="Після видалення акаунти, ти втратиш всі тобою створені кола та записи буде видалено"
        confirmText="Видалити"
        cancelText="Назад"
      />

      <ConfirmationModal
        isVisible={isLogoutVisible}
        onCancel={() => setIsLogoutVisible(false)}
        onConfirm={() => {
          setIsLogoutVisible(false);
          logout();
        }}
        title="Вийти з акаунту?"
        message="Ви впевнені, що хочете вийти з цього пристрою?"
        confirmText="Вийти"
        cancelText="Назад"
      />

      <ConfirmationModal
        isVisible={isDeleteAvatarVisible}
        onCancel={() => setIsDeleteAvatarVisible(false)}
        onConfirm={async () => {
          setIsDeleteAvatarVisible(false);
          try {
            await apiFetch(`/users/${user?.id}/avatar`, { method: "DELETE" });
            updateUser({ avatarUpdatedAt: undefined });
            setAvatarUrl(null);
          } catch (e) {
            Alert.alert("Помилка", "Не вдалося видалити аватар");
          }
        }}
        title="Видалити аватар?"
        message="Ви впевнені, що хочете видалити фото профілю?"
        confirmText="Видалити"
        cancelText="Скасувати"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerContainer: { alignItems: "center", marginBottom: 30, padding: 20 },
  header: { fontSize: 28, fontWeight: "600", marginBottom: 20 },

  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  avatarButtons: { flexDirection: "row", gap: 10, marginBottom: 5 },
  avatarButton: { backgroundColor: "#2196F3", padding: 10, borderRadius: 10, marginHorizontal: 5 },
  removeButton: { backgroundColor: "#FF6B6B" },
  avatarButtonText: { color: "#fff", fontWeight: "600" },

  block: { marginBottom: 20, paddingHorizontal: 20 },
  label: { fontSize: 16, marginBottom: 8, fontWeight: "600", color: "#333" },
  requiredStar: { color: "#D9534F", fontSize: 16 },
  input: {
    height: 50,
    backgroundColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },

  phoneWrapper: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 12,
    overflow: "hidden",
  },
  prefixButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  prefixText: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#1A1A1A",
  },

  save: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  changePassword: {
    marginTop: 15,
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  changePasswordText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  logout: {
    marginTop: 20,
    backgroundColor: "#5D6470",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  delete: {
    marginTop: 15,
    backgroundColor: "transparent",
    padding: 15,
    alignItems: "center",
    marginHorizontal: 20,
  },
  deleteText: { color: "#FF3B30", fontSize: 16, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 24 },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#1A1A1A",
  },
  modalPasswordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 12,
  },
  modalPasswordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#1A1A1A",
  },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 14 },
  modalError: { color: "#D32F2F", fontSize: 14, marginBottom: 12, textAlign: "center" },
  modalSave: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalSaveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalCancel: { padding: 15, borderRadius: 12, alignItems: "center", marginTop: 8 },
  modalCancelText: { color: "#999", fontSize: 16, fontWeight: "500" },

  bottomModal: { justifyContent: "flex-end", margin: 0 },
  prefixModalContent: {
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
  prefixModalTitle: {
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
