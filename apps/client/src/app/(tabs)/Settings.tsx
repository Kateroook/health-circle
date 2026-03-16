import { Button } from "@/src/components/Button";
import { PhoneInput } from "@/src/components/fields/PhoneInput";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
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
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import ConfirmationModal from "../../components/ConfirmationModal";

import { apiFetch, apiUploadFile, getAvatarUrl } from "../../api/api";
import { useAuthStore } from "../../store/authStore";
import { cleanObj } from "../../utils/clean.util";
import { formatErrorMessage } from "../../utils/error.util";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
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
  const [isDeleteAccountVisible, setIsDeleteAccountVisible] = useState(false);
  const [isDeleteAvatarVisible, setIsDeleteAvatarVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);

  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(false);
  const [toggle3, setToggle3] = useState(false);
  const [toggle4, setToggle4] = useState(false);
  const [toggle5, setToggle5] = useState(false);
  const [toggle6, setToggle6] = useState(false);
  const [toggle7, setToggle7] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  useEffect(() => {
    if (user?.id) setAvatarUrl(getAvatarUrl(user.id, user.avatarUpdatedAt));
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

    if (trimmedMiddle) {
      if (trimmedMiddle.length < 2) {
        errors.push("По-батькові має містити не менше 2 символів");
      } else if (trimmedMiddle.length > 50) {
        errors.push("По-батькові має містити не більше 50 символів");
      }
    }

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) errors.push("Не можна зберегти порожнє повне імʼя");
    else if (trimmedFullName.length > 255) {
      errors.push("Повне імʼя має містити не більше 255 символів");
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
          }),
        ),
      });
      Alert.alert("Успіх", "Дані оновлено");
      await refreshProfile();
      setIsEditMode(false); // ← ховаємо форму після успіху
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

        // Update local user state immediately with new avatarUpdatedAt
        if (response && response.avatarUpdatedAt && user?.id) {
          updateUser({ avatarUpdatedAt: response.avatarUpdatedAt });
          const freshUrl = `${getAvatarUrl(user.id, response.avatarUpdatedAt)}?_${Date.now()}`;
          setAvatarUrl(freshUrl);
          setImageError(false);
        }

        await refreshProfile();
        Alert.alert("Успіх", "Аватар оновлено");
      } catch (e: any) {
        Alert.alert("Помилка", e?.message || "Не вдалося оновити аватар");
      }
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountVisible(true);
  };

  const handleRemoveAvatar = async () => {
    setIsDeleteAvatarVisible(true);
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
      label: "Відображаєме імʼя",
      value: fullName,
      setter: setFullName,
      placeholder: "Введіть відображаєме імʼя",
      maxLength: 255,
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

  const CustomToggle = ({
    value,
    onValueChange,
  }: {
    value: boolean;
    onValueChange: (newValue: boolean) => void;
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onValueChange(!value)}
        style={{
          width: 54,
          height: 32,
          borderRadius: 16,
          backgroundColor: value ? "#5B8DEE" : "#E0E0E0",
          justifyContent: "center",
          paddingHorizontal: 3,
        }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: "#FFFFFF",
            alignSelf: value ? "flex-end" : "flex-start",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
            elevation: 3,
          }}
        >
          {value && (
            <Text
              style={{
                color: "#2196F3",
                fontSize: 18,
                fontWeight: "bold",
                lineHeight: 20,
              }}
            >
              ✓
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headerContainer}>
          <Image
            key={avatarUrl || "no-avatar"}
            source={!imageError && avatarUrl ? { uri: avatarUrl } : defaultAvatar}
            style={styles.avatar}
            onError={() => setImageError(true)}
          />

          <Typography variant="h2" tone="primary" style={styles.profileName}>
            {user?.firstName}
          </Typography>

          {/* Нова кнопка "Редагувати" */}
          {!isEditMode && (
            <Button
              label="Редагуввати"
              hierarchy="accent"
              size="medium"
              shape="rectangle"
              leadingIcon={<Icon name="edit-2" size={18} color={theme.colors.content.onColor} />}
              onPress={() => setIsEditMode(true)}
              style={{ width: "100%" }}
            />
          )}

          {/* Блок редагування — показується тільки в режимі isEditMode */}
          {isEditMode && (
            <View style={styles.editContainer}>
              <View style={styles.avatarButtons}>
                <Button
                  label="Змінити аватар"
                  hierarchy="secondary"
                  size="small"
                  shape="rectangle"
                  onPress={handlePickAvatar}
                />

                {avatarUrl && !imageError && (
                  <Button
                    label="Видалити аватар"
                    hierarchy="secondary"
                    size="small"
                    shape="rectangle"
                    onPress={handleRemoveAvatar}
                  />
                )}
              </View>

              {fields.map((field) => (
                <View key={field.label} style={styles.block}>
                  <Typography variant="body2" tone="primary" style={styles.label}>
                    {field.label}
                    {field.required ? (
                      <Typography variant="body2" tone="negative" style={styles.requiredStar}>
                        {" "}
                        *
                      </Typography>
                    ) : (
                      <Typography variant="caption" tone="secondary" style={styles.optionalText}>
                        {" "}
                        (опціонально)
                      </Typography>
                    )}
                  </Typography>
                  {field.label === "Номер телефону" ? (
                    <PhoneInput
                      value={field.value}
                      onChangeText={field.setter}
                      placeholder={field.placeholder}
                      showClearButton={false}
                    />
                  ) : (
                    <TextInput
                      style={styles.input}
                      value={field.value}
                      onChangeText={field.setter}
                      placeholder={field.placeholder}
                      placeholderTextColor="#999"
                      keyboardType={field.keyboardType as any}
                      maxLength={field.maxLength}
                    />
                  )}
                </View>
              ))}

              <Button
                label="Зберегти"
                hierarchy="primary"
                size="medium"
                shape="rectangle"
                onPress={handleSave}
                style={styles.save}
              />

              {/* Опціонально: кнопка "Скасувати" */}
              <Button
                label="Скасувати"
                hierarchy="tertiary"
                size="medium"
                shape="rectangle"
                onPress={() => {
                  setIsEditMode(false);
                  setFirstName(user?.firstName || "");
                  setMiddleName(user?.middleName || "");
                  setLastName(user?.lastName || "");
                  setPhone(user?.phone || "");
                }}
                style={styles.cancelButton}
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.notificationsHeader}
          onPress={() => setIsNotificationsModalVisible(true)}
        >
          <MaterialCommunityIcons
            name="bell"
            size={24}
            color={theme.colors.content.primary}
            style={{ marginRight: 12 }}
          />
          <Typography variant="subtitle1" tone="primary">
            Сповіщення
          </Typography>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#000000"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        {/* 2. Кнопка "Приватність та безпека" (нова, над "Вихід") */}
        <TouchableOpacity
          style={styles.securityHeader}
          onPress={() => setIsSecurityOpen(!isSecurityOpen)}
        >
          <MaterialCommunityIcons
            name="shield-lock"
            size={24}
            color={theme.colors.content.primary}
            style={{ marginRight: 12 }}
          />
          <Typography variant="subtitle1" tone="primary" style={styles.securityHeaderText}>
            Приватність та безпека
          </Typography>
          <MaterialCommunityIcons
            name={isSecurityOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color="#000000"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        {isSecurityOpen && (
          <View style={styles.securityContent}>
            <TouchableOpacity
              style={styles.securityItem}
              onPress={() => setShowPasswordModal(true)}
            >
              <MaterialCommunityIcons
                name="key-variant"
                size={22}
                color={theme.colors.content.primary}
                style={{ marginRight: 12 }}
              />
              <Typography variant="subtitle1" tone="primary">
                Змінити пароль
              </Typography>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#888"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.securityItem} onPress={handleDeleteAccount}>
              <MaterialCommunityIcons
                name="delete-forever"
                size={22}
                color={theme.colors.negative}
                style={{ marginRight: 12 }}
              />
              <Typography variant="subtitle1" tone="negative" style={styles.securityItemText}>
                Видалити акаунт
              </Typography>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#888"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          </View>
        )}

        <Button
          label="Вихід"
          hierarchy="tertiary"
          size="medium"
          shape="rectangle"
          leadingIcon={
            <MaterialCommunityIcons
              name="door-open"
              size={24}
              color={theme.colors.content.primary}
              style={{ marginRight: 12 }}
            />
          }
          onPress={() => setIsLogoutVisible(true)}
          style={styles.logoutButton}
        />
      </ScrollView>

      <ConfirmationModal
        isVisible={isLogoutVisible}
        onCancel={() => setIsLogoutVisible(false)}
        onConfirm={async () => {
          setIsLogoutVisible(false);
          logout();
        }}
        title="Вийти"
        message="Ти впевнений, що хочеш вийти?"
        confirmText="Вийти"
        cancelText="Назад"
        confirmStyle="default"
      />

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h3" tone="primary" style={styles.modalTitle}>
              Змінити пароль
            </Typography>

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

            {passwordError ? (
              <Typography variant="caption" tone="negative" style={styles.modalError}>
                {passwordError}
              </Typography>
            ) : null}

            <Button
              label={passwordLoading ? "Збереження..." : "Змінити пароль"}
              hierarchy="primary"
              size="medium"
              shape="rectangle"
              onPress={handleChangePassword}
              disabled={passwordLoading}
              loading={passwordLoading}
              style={styles.modalSave}
            />

            <Button
              label="Скасувати"
              hierarchy="tertiary"
              size="medium"
              shape="rectangle"
              onPress={() => {
                setShowPasswordModal(false);
                setPasswordError("");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              style={styles.modalCancel}
            />
          </View>
        </View>
      </Modal>

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
        message="Після видалення акаунта всі кола та контакти будуть безповоротно видалені"
        confirmText="Видалити"
        cancelText="Назад"
        confirmStyle="default"
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

      <Modal
        visible={isNotificationsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsNotificationsModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
          {/* Заголовок */}
          <View
            style={{
              height: 56,
              backgroundColor: "#fff",
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
              justifyContent: "center", // центр для заголовка
            }}
          >
            <Typography
              variant="h3"
              tone="primary"
              style={{
                textAlign: "center",
              }}
            >
              Сповіщення
            </Typography>

            <TouchableOpacity
              onPress={() => setIsNotificationsModalVisible(false)}
              style={{
                position: "absolute",
                right: 16,
                top: 0,
                bottom: 0,
                justifyContent: "center",
                paddingHorizontal: 8,
              }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <MaterialCommunityIcons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Основний вміст */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 40, // додаємо запас знизу
            }}
          >
            {[
              {
                label: "Отримувати сповіщення, коли у вашому районі повітряна тривога",
                value: toggle1,
                setter: setToggle1,
              },
              {
                label: "Отримувати сповіщення про статус членів Кола",
                value: toggle2,
                setter: setToggle2,
              },
              {
                label:
                  'Отримувати сповіщення, коли у когось стан залишається "Невідомо" під час тривоги',
                value: toggle3,
                setter: setToggle3,
              },
              {
                label: "Нагадувати оновити статус під час тривоги",
                value: toggle4,
                setter: setToggle4,
              },
              { label: "Нагадувати позначити настрій", value: toggle5, setter: setToggle5 },
              {
                label: "Отримувати SMS лише тоді, коли немає інтернету, але є важливе сповіщення",
                value: toggle6,
                setter: setToggle6,
              },
              { label: "SMS для статусу безпеки", value: toggle7, setter: setToggle7 },
            ].map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f0f0f0",
                }}
              >
                <Typography
                  variant="body1"
                  tone="primary"
                  style={{
                    flex: 1,
                    paddingRight: 16,
                  }}
                >
                  {item.label}
                </Typography>
                <CustomToggle value={item.value} onValueChange={item.setter} />
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing[16],
    backgroundColor: theme.colors.background.primary,
  },
  headerContainer: {
    alignItems: "center",
    paddingTop: theme.spacing[72],
    paddingBottom: theme.spacing[32],
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  avatarButtons: {
    flexDirection: "row",
    justifyContent: "center", // ← головна зміна: центруємо вміст
    gap: 16, // замість gap: 10, щоб було гарніше
    marginBottom: 16,
    width: "100%", // на всю ширину, щоб центр працював
  },

  removeButton: { backgroundColor: "#FF6B6B" },
  avatarButtonText: { color: "#fff", fontWeight: "600" },

  block: { marginBottom: 20 },
  label: { fontSize: 18, marginBottom: 8 },
  requiredStar: { color: "#D9534F", fontSize: 18 },
  input: {
    height: 50,
    backgroundColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },

  profileName: {
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[32],
    textAlign: "center",
  },

  save: {
    marginTop: 10,
    backgroundColor: "#000000",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 20,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  securityHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 20,
    //borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  securityHeaderText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },

  securityContent: {
    marginTop: 8,
    marginHorizontal: 20,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    //borderWidth: 1,
    borderColor: theme.colors.border.opaque,
    overflow: "hidden", // щоб дочірні елементи не вилазили за кути
  },

  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginHorizontal: 20,
  },

  securityItemText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },

  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
  },

  logout: {
    marginTop: 20,
    backgroundColor: "#FF6B6B",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  logoutText: { color: "#fff", fontSize: 16 },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start", // вміст зліва
    backgroundColor: "#ffffff", // білий фон
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    marginHorizontal: 20,
  },

  logoutTextNew: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500", // або '600' якщо хочеш жирніший текст
  },

  editContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 10,
  },

  cancelButton: {
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    marginHorizontal: 20,
  },

  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },

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
  notificationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  notificationsHeaderText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },

  // ──────────────────────────────────────────────
  // Стилі для модалки сповіщень
  notificationsModalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: "auto",
  },

  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  notificationLabel: {
    fontSize: 16,
    color: "#1A1A1A",
    flex: 1,
    paddingRight: 16,
  },

  modalCloseButton: {
    marginTop: 20,
    backgroundColor: "#5B8DEE",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  modalCloseText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  optionalText: {
    fontSize: 14,
    color: "#999",
  },
});
