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
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";

import { apiFetch, apiUploadFile, getAvatarUrl } from "../../api/api";
import { useAuthStore } from "../../store/authStore";
import { cleanObj } from "../../utils/clean.util";
import { formatErrorMessage } from "../../utils/error.util";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const defaultAvatar = require("../../assets/images/default-avatar.png");

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user?.id)
      setAvatarUrl(getAvatarUrl(user.id, user.avatarUpdatedAt));
  }, [user]);

  const validate = () => {
    const errors: string[] = [];
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedMiddle = middleName.trim();
    const trimmedPhone = phone.trim();

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

    if (trimmedMiddle && trimmedMiddle.length < 2) {
      errors.push("По-батькові має містити не менше 2 символів");
    } else if (trimmedMiddle.length > 50) {
      errors.push("По-батькові має містити не більше 50 символів");
    }

    if (!trimmedPhone) {
      errors.push("Номер телефону є обовʼязковим");
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validate();
    if (errors.length > 0) {
      Alert.alert("Помилка", errors.join("\n"));
      return;
    }

    try {
      await apiFetch("/users", {
        method: "PUT",
        body: JSON.stringify(
          cleanObj({
            id: user?.id,
            firstName: firstName.trim(),
            middleName: middleName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            email: user?.email,
          })
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
        await apiUploadFile(`/users/${user?.id}/avatar`, {
          uri: localUri,
          name: filename,
          type,
        });
        // refresh avatar with cache-busting
        // setAvatarUrl(`${getAvatarUrl(user?.id)}?t=${Date.now()}`);
        await refreshProfile();
        Alert.alert("Успіх", "Аватар оновлено");
      } catch (e: any) {
        Alert.alert("Помилка", e?.message || "Не вдалося оновити аватар");
      }
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Видалити акаунт?", "Цю дію не можна скасувати.", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch("/users", { method: "DELETE" });
            logout();
          } catch (e) {
            Alert.alert("Помилка", "Не вдалося видалити акаунт");
          }
        },
      },
    ]);
  };

  const handleRemoveAvatar = async () => {
    Alert.alert("Видалити аватар?", "", [
      { text: "Скасувати", style: "cancel" },
      {
        text: "Видалити",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/users/${user?.id}/avatar`, { method: "DELETE" });
            setAvatarUrl(null);
            Alert.alert("Успіх", "Аватар видалено");
          } catch (e) {
            Alert.alert("Помилка", "Не вдалося видалити аватар");
          }
        },
      },
    ]);
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
      required: false,
    },
    {
      label: "Номер телефону",
      value: phone,
      setter: setPhone,
      placeholder: "+380...",
      keyboardType: "phone-pad",
      required: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Налаштування</Text>

          <Image
            source={
              !imageError && avatarUrl ? { uri: avatarUrl } : defaultAvatar
            }
            style={styles.avatar}
            onError={() => setImageError(true)}
          />

          <View style={styles.avatarButtons}>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={handlePickAvatar}
            >
              <Text style={styles.avatarButtonText}>Змінити аватар</Text>
            </TouchableOpacity>
            {avatarUrl && !imageError && (
              <TouchableOpacity
                style={[styles.avatarButton, styles.removeButton]}
                onPress={handleRemoveAvatar}
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
              keyboardType={field.keyboardType as any}
              maxLength={field.maxLength}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.save} onPress={handleSave}>
          <Text style={styles.saveText}>Зберегти</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.changePassword}
          onPress={() => setShowPasswordModal(true)}
        >
          <Text style={styles.changePasswordText}>Змінити пароль</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Вийти</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.delete} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Видалити акаунт</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
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
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={styles.eyeButton}>
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
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
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
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {passwordError ? (
              <Text style={styles.modalError}>{passwordError}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.modalSave,
                passwordLoading && { opacity: 0.6 },
              ]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerContainer: { alignItems: "center", marginBottom: 30, padding: 20 },
  header: { fontSize: 28, fontWeight: "600", marginBottom: 20 },

  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  avatarButtons: { flexDirection: "row", gap: 10, marginBottom: 5 },
  avatarButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  removeButton: { backgroundColor: "#FF6B6B" },
  avatarButtonText: { color: "#fff", fontWeight: "600" },

  block: { marginBottom: 20, paddingHorizontal: 20 },
  label: { fontSize: 18, marginBottom: 8 },
  requiredStar: { color: "#D9534F", fontSize: 18 },
  input: {
    height: 50,
    backgroundColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
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

  logout: {
    marginTop: 20,
    backgroundColor: "#FF6B6B",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  logoutText: { color: "#fff", fontSize: 16 },

  delete: {
    marginTop: 15,
    backgroundColor: "#D9534F",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  deleteText: { color: "#fff", fontSize: 16 },

  changePassword: {
    marginTop: 15,
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  changePasswordText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#1A1A1A",
  },
  modalInput: {
    height: 50,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
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
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  modalError: {
    color: "#D32F2F",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  modalSave: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalSaveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalCancel: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalCancelText: { color: "#999", fontSize: 16, fontWeight: "500" },
});
