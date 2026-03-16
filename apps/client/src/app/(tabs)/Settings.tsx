import { Button } from "@/src/components/Button";
import { PasswordField, TextField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { Feather as Icon, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ConfirmationModal from "../../components/ConfirmationModal";

import { Avatar } from "@/src/components/Avatar";
import { ListItem } from "@/src/components/ListItem";
import { apiFetch, apiUploadFile, getAvatarUrl } from "../../api/api";
import { useFcmToken } from "../../hooks/useFcmToken";
import { useAuthStore } from "../../store/authStore";
import { useLocationStore } from "../../store/locationStore";
import { useSettingsStore } from "../../store/settingsStore";
import { cleanObj } from "../../utils/clean.util";
import { formatErrorMessage } from "../../utils/error.util";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { updateCurrentLocation, loading: locationLoading } = useLocationStore();
  const { isPushEnabled, setPushEnabled } = useSettingsStore();
  const { requestPermission } = useFcmToken();

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
  const [isDeleteAccountVisible, setIsDeleteAccountVisible] = useState(false);
  const [isDeleteAvatarVisible, setIsDeleteAvatarVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);

  const [notifSettings, setNotifSettings] = useState<any>(null);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (isNotificationsModalVisible) {
      fetchNotifSettings();
    }
  }, [isNotificationsModalVisible]);

  const fetchNotifSettings = async () => {
    setNotifLoading(true);
    try {
      const data = await apiFetch("/users/notifications/settings");
      setNotifSettings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setNotifLoading(false);
    }
  };

  const updateNotifSetting = async (key: string, value: boolean) => {
    setNotifSettings((prev: any) => (prev ? { ...prev, [key]: value } : prev));
    try {
      await apiFetch("/users/notifications/settings", {
        method: "PUT",
        body: JSON.stringify({ [key]: value }),
      });
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося зберегти налаштування");
      fetchNotifSettings();
    }
  };

  useEffect(() => {
    // Ensure text fields stay in sync when the user object changes (e.g., after refreshProfile)
    setFirstName(user?.firstName || "");
    setMiddleName(user?.middleName || "");
    setLastName(user?.lastName || "");
    setFullName(user?.fullName || "");
    setPhone(user?.phone || "");
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
        if (response?.avatarUpdatedAt) {
          updateUser({ avatarUpdatedAt: response.avatarUpdatedAt });
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

  const handleLocationUpdate = async () => {
    if (locationLoading) return;

    try {
      await updateCurrentLocation();
      Alert.alert("Успіх", "Геолокацію оновлено");
    } catch (e: any) {
      if (e.message === "LOCATION_PERMISSION_DENIED") {
        Alert.alert(
          "Доступ заборонено",
          "Будь ласка, дозвольте доступ до геолокації в налаштуваннях пристрою.",
        );
      } else {
        Alert.alert("Помилка", "Не вдалося оновити геолокацію");
      }
    }
  };

  const insets = useSafeAreaInsets();

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.headerContainer}>
          <Avatar
            userId={user?.id ?? ""}
            avatarUpdatedAt={user?.avatarUpdatedAt}
            size="xl"
            border={true}
          />

          <Typography variant="h2" tone="primary" style={styles.profileName}>
            {user?.firstName}
          </Typography>

          {/* Нова кнопка "Редагувати" */}
          {!isEditMode && (
            <Button
              label="Редагувати"
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
                  <TextField
                    label={field.label}
                    required={field.required}
                    value={field.value}
                    onChangeText={field.setter}
                    placeholder={field.placeholder}
                    keyboardType={field.keyboardType as any}
                    maxLength={field.maxLength}
                  />
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
                hierarchy="secondary"
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

        <View style={styles.settingsSection}>
          <ListItem
            layout="compact"
            artworkSize="small"
            label="Сповіщення"
            leadingIcon={
              <MaterialCommunityIcons name="bell" size={24} color={theme.colors.content.primary} />
            }
            onPress={() => setIsNotificationsModalVisible(true)}
            showDivider={false}
          />
        </View>

        {/* 2. Кнопка "Приватність та безпека"*/}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => setIsSecurityOpen(!isSecurityOpen)}
          >
            <MaterialCommunityIcons
              name="shield-lock"
              size={24}
              color={theme.colors.content.primary}
            />
            <Typography variant="subtitle1" tone="primary" style={styles.settingsRowLabel}>
              Приватність та безпека
            </Typography>
            <MaterialCommunityIcons
              name={isSecurityOpen ? "chevron-up" : "chevron-down"}
              size={28}
              color={theme.colors.content.primary}
            />
          </TouchableOpacity>

          {isSecurityOpen && (
            <>
              <View style={styles.separator} />
              <ListItem
                layout="compact"
                artworkSize="small"
                label="Змінити пароль"
                leadingIcon={
                  <MaterialCommunityIcons
                    name="key-variant"
                    size={22}
                    color={theme.colors.content.primary}
                  />
                }
                onPress={() => setShowPasswordModal(true)}
              />
              <ListItem
                layout="compact"
                artworkSize="small"
                label="Видалити акаунт"
                leadingIcon={
                  <MaterialCommunityIcons
                    name="delete-forever"
                    size={22}
                    color={theme.colors.negative}
                  />
                }
                onPress={handleDeleteAccount}
                showDivider={false}
              />
            </>
          )}
        </View>
        <View style={styles.settingsSection}>
          <ListItem
            layout="compact"
            artworkSize="small"
            label={locationLoading ? "Оновлення..." : "Оновити геолокацію"}
            leadingIcon={
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={24}
                color={theme.colors.content.primary}
              />
            }
            onPress={handleLocationUpdate}
            hideChevron={true}
            showDivider={false}
          />
        </View>
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
          onPress={logout}
          style={styles.logoutButton}
        />
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
            <Typography variant="h3" tone="primary" style={styles.modalTitle}>
              Змінити пароль
            </Typography>

            <View style={{ gap: 12 }}>
              <PasswordField
                label="Поточний пароль"
                required
                placeholder="Введіть поточний пароль"
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <PasswordField
                label="Новий пароль"
                required
                placeholder="Новий пароль (мін. 12 символів)"
                value={newPassword}
                onChangeText={setNewPassword}
                caption="Має містити щонайменше 12 символів"
              />
              <PasswordField
                label="Підтвердіть новий пароль"
                required
                placeholder="Повторно введіть новий пароль"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                errorMessage={passwordError || undefined}
              />
            </View>

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
        message="Цю дію не можна скасувати."
        confirmText="Видалити"
        cancelText="Скасувати"
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
        <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
          {/* Safe area spacer — handles Dynamic Island on iOS and status bar on Android */}
          <View style={{ height: insets.top, backgroundColor: theme.colors.background.primary }} />
          {/* Header */}
          <View style={notifStyles.header}>
            <Typography variant="h3" tone="primary" style={{ flex: 1, textAlign: "center" }}>
              Сповіщення
            </Typography>
            <Button
              shape="round"
              hierarchy="tertiary"
              size="small"
              leadingIcon={
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={theme.colors.content.primary}
                />
              }
              onPress={() => setIsNotificationsModalVisible(false)}
              style={{ position: "absolute", left: theme.spacing[16] }}
            />
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={notifStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={notifStyles.listSection}>
              {[
                {
                  label: "Отримувати сповіщення, коли у вашому районі повітряна тривога",
                  value: notifSettings?.airAlerts ?? false,
                  key: "airAlerts",
                },
                {
                  label: "Отримувати сповіщення про статус членів Кола",
                  value: notifSettings?.statusUpdates ?? false,
                  key: "statusUpdates",
                },
                {
                  label:
                    'Отримувати сповіщення, коли у когось стан залишається "Невідомо" під час тривоги',
                  value: notifSettings?.unknownStatusAlerts ?? false,
                  key: "unknownStatusAlerts",
                },
                {
                  label: "Нагадувати оновити статус під час тривоги",
                  value: notifSettings?.statusUpdateReminders ?? false,
                  key: "statusUpdateReminders",
                },
                {
                  label: "Нагадувати позначити настрій",
                  value: notifSettings?.moodReminders ?? false,
                  key: "moodReminders",
                },
                {
                  label: "Отримувати SMS лише тоді, коли немає інтернету, але є важливе сповіщення",
                  value: notifSettings?.smsFallover ?? false,
                  key: "smsFallover",
                },
                {
                  label: "SMS для статусу безпеки",
                  value: notifSettings?.smsSafetyStatus ?? false,
                  key: "smsSafetyStatus",
                },
              ].map((item, index, arr) => (
                <ListItem
                  key={index}
                  layout="switch"
                  artworkSize="none"
                  label={item.label}
                  switchValue={item.value}
                  onSwitchChange={(val) => updateNotifSetting(item.key, val)}
                  showDivider={index < arr.length - 1}
                />
              ))}
            </View>

            <Typography variant="h3" tone="primary" style={{ marginTop: 24, marginBottom: 16 }}>
              Системні налаштування
            </Typography>

            <View style={notifStyles.listSection}>
              <ListItem
                layout="switch"
                artworkSize="none"
                label="Дозволити push-сповіщення"
                switchValue={notifSettings?.enabled ?? isPushEnabled}
                onSwitchChange={async (val) => {
                  if (val) {
                    const granted = await requestPermission();
                    if (!granted) {
                      Alert.alert(
                        "Дозвіл не отримано",
                        "Будь ласка, дозвольте сповіщення у налаштуваннях пристрою.",
                      );
                      return;
                    }
                  }
                  setPushEnabled(val);
                  updateNotifSetting("enabled", val);
                }}
              />
            </View>
          </ScrollView>
        </View>
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
    paddingTop: theme.spacing[20],
    paddingBottom: theme.spacing[32],
  },
  avatarButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
    width: "100%",
  },
  block: { marginBottom: theme.spacing[16] },
  profileName: {
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[32],
    textAlign: "center",
  },
  save: {
    marginTop: theme.spacing[8],
    alignItems: "center",
  },
  settingsSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.lg,
    overflow: "hidden", // clips ListItem rows to rounded corners
    marginBottom: theme.spacing[8],
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing[10],
    paddingHorizontal: theme.spacing[16],
    gap: theme.spacing[16],
    backgroundColor: theme.colors.background.secondary,
  },
  settingsRowLabel: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border.opaque,
    marginLeft: theme.spacing[16],
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start", // вміст зліва
    backgroundColor: theme.colors.background.secondary,
    marginTop: theme.spacing[8],
  },
  editContainer: {
    width: "100%",
    paddingHorizontal: theme.spacing[16],
    marginTop: theme.spacing[8],
  },
  cancelButton: {
    marginTop: theme.spacing[8],
    alignItems: "center",
  },

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
});
// ──────────────────────────────────────────────
const notifStyles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.opaque,
  },
  scrollContent: {
    padding: theme.spacing[16],
    paddingBottom: theme.spacing[40],
  },
  listSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    overflow: "hidden", // clips the ListItem dividers to rounded corners
  },
});
