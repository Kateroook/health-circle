import { Avatar } from "@/src/components/Avatar";
import { Button } from "@/src/components/Button";
import { PhoneInput } from "@/src/components/fields/PhoneInput";
import { PasswordField, TextField } from "@/src/components/fields/TextField";
import { ListItem } from "@/src/components/ListItem";
import { ModalContainer } from "@/src/components/modal/ModalContainer";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { Feather as Icon, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch, apiUploadFile, getAvatarUrl } from "../../api/api";
import ConfirmationModal from "../../components/ConfirmationModal";
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
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // UI state
  const [isDeleteAccountVisible, setIsDeleteAccountVisible] = useState(false);
  const [isDeleteAvatarVisible, setIsDeleteAvatarVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);
  const [isSecurityScreenVisible, setIsSecurityScreenVisible] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  // Notifications
  const [notifSettings, setNotifSettings] = useState<any>(null);
  const [notifLoading, setNotifLoading] = useState(false);

  // Local-only permission toggles (no server call)
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [contactsEnabled, setContactsEnabled] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isNotificationsModalVisible) fetchNotifSettings();
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
    } catch {
      Alert.alert("Помилка", "Не вдалося зберегти налаштування");
      fetchNotifSettings();
    }
  };

  useEffect(() => {
    setFirstName(user?.firstName || "");
    setMiddleName(user?.middleName || "");
    setLastName(user?.lastName || "");
    setPhone(user?.phone || "");
    if (user?.id) setAvatarUrl(getAvatarUrl(user.id, user.avatarUpdatedAt));
  }, [user]);

  const validate = () => {
    const errors: string[] = [];
    const f = firstName.trim(),
      l = lastName.trim(),
      m = middleName.trim();
    if (!f || f.length < 2) errors.push("Імʼя має містити не менше 2 символів");
    else if (f.length > 50) errors.push("Імʼя має містити не більше 50 символів");
    if (!l || l.length < 2) errors.push("Прізвище має містити не менше 2 символів");
    else if (l.length > 50) errors.push("Прізвище має містити не більше 50 символів");
    if (m) {
      if (m.length < 2) errors.push("По батькові має містити не менше 2 символів");
      else if (m.length > 50) errors.push("По батькові має містити не більше 50 символів");
    }
    if (!phone.trim()) errors.push("Номер телефону є обовʼязковим");
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
      setIsEditMode(false);
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
        if (response?.avatarUpdatedAt) updateUser({ avatarUpdatedAt: response.avatarUpdatedAt });
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
      label: "По батькові",
      value: middleName,
      setter: setMiddleName,
      placeholder: "Введіть по батькові",
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

  // ─── Security Screen ─────────────────────────────
  if (isSecurityScreenVisible) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <Button
            shape="round"
            hierarchy="tertiary"
            size="medium"
            leadingIcon={
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={theme.colors.content.primary}
              />
            }
            onPress={() => setIsSecurityScreenVisible(false)}
          />
          <Typography variant="h3" tone="primary" style={styles.screenHeaderTitle}>
            Приватність та безпека
          </Typography>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* ДОЗВОЛИ СИСТЕМИ */}
          <Typography variant="subtitle2" tone="secondary" style={styles.sectionLabel}>
            ДОЗВОЛИ СИСТЕМИ
          </Typography>
          <View style={styles.settingsSection}>
            <ListItem
              layout="switch"
              artworkSize="none"
              label="Push-сповіщення"
              switchValue={notifSettings?.enabled ?? isPushEnabled}
              showDivider={true}
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
            <ListItem
              layout="switch"
              artworkSize="none"
              label="SMS-сповіщення"
              subLabel="Може стягуватись тариф твого оператора"
              switchValue={notifSettings?.smsFallover ?? false}
              showDivider={true}
              onSwitchChange={(val) => updateNotifSetting("smsFallover", val)}
            />
            <ListItem
              layout="switch"
              artworkSize="none"
              label="Геолокація"
              subLabel="Локація надсилається лише після натискання «Потрібна допомога»"
              switchValue={locationEnabled}
              showDivider={true}
              onSwitchChange={setLocationEnabled}
            />
            <ListItem
              layout="switch"
              artworkSize="none"
              label="Доступ до контактів"
              switchValue={contactsEnabled}
              showDivider={false}
              onSwitchChange={setContactsEnabled}
            />
          </View>

          {/* ОБЛІКОВИЙ ЗАПИС */}
          <Typography variant="subtitle2" tone="secondary" style={styles.sectionLabel}>
            ОБЛІКОВИЙ ЗАПИС
          </Typography>
          <View style={styles.settingsSection}>
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
              onPress={() => setIsDeleteAccountVisible(true)}
              showDivider={false}
            />
          </View>
        </ScrollView>

        <ModalContainer isVisible={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
          <Typography variant="h3" tone="primary" style={{ textAlign: "center" }}>
            Змінити пароль
          </Typography>
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
          <Button
            label={passwordLoading ? "Збереження..." : "Змінити пароль"}
            hierarchy="primary"
            size="medium"
            shape="rectangle"
            onPress={handleChangePassword}
            disabled={passwordLoading}
            loading={passwordLoading}
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
          />
        </ModalContainer>

        <ConfirmationModal
          isVisible={isDeleteAccountVisible}
          onCancel={() => setIsDeleteAccountVisible(false)}
          onConfirm={async () => {
            setIsDeleteAccountVisible(false);
            try {
              await apiFetch("/users", { method: "DELETE" });
              logout();
            } catch {
              Alert.alert("Помилка", "Не вдалося видалити акаунт");
            }
          }}
          title="Видалити акаунт?"
          message="Після видалення акаунта всі кола та контакти будуть безповоротно видалені"
          confirmText="Видалити"
          cancelText="Назад"
          confirmStyle="default"
        />
      </SafeAreaView>
    );
  }

  // ─── Main Settings Screen ────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile header */}
        <View style={styles.headerContainer}>
          <Avatar
            userId={user?.id ?? ""}
            avatarUpdatedAt={user?.avatarUpdatedAt}
            size="xl"
            border
          />

          <Typography variant="h2" tone="primary" style={styles.profileName}>
            {user?.firstName}
          </Typography>

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
                    onPress={() => setIsDeleteAvatarVisible(true)}
                  />
                )}
              </View>

              {fields.map((field) => (
                <View key={field.label} style={styles.block}>
                  {field.label === "Номер телефону" ? (
                    <View>
                      <Typography variant="body2" tone="primary" style={{ marginBottom: 4 }}>
                        {field.label}
                        {field.required && (
                          <Typography variant="body2" tone="negative">
                            {" "}
                            *
                          </Typography>
                        )}
                      </Typography>
                      <PhoneInput
                        value={field.value}
                        onChangeText={field.setter}
                        placeholder={field.placeholder}
                        showClearButton={false}
                      />
                    </View>
                  ) : (
                    <TextField
                      label={field.label}
                      required={field.required}
                      value={field.value}
                      onChangeText={field.setter}
                      placeholder={field.placeholder}
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

        {/* Notifications */}
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

        {/* Security */}
        <View style={styles.settingsSection}>
          <ListItem
            layout="compact"
            artworkSize="small"
            label="Приватність та безпека"
            leadingIcon={
              <MaterialCommunityIcons
                name="shield-lock"
                size={24}
                color={theme.colors.content.primary}
              />
            }
            onPress={() => setIsSecurityScreenVisible(true)}
            showDivider={false}
          />
        </View>

        {/* Location */}
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

        {/* Logout */}
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
          style={[styles.logoutButton, { justifyContent: "flex-start" }]}
        />
      </ScrollView>

      {/* Change Password Modal */}
      <ModalContainer isVisible={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
        <Typography variant="h3" tone="primary" style={{ textAlign: "center" }}>
          Змінити пароль
        </Typography>
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
        <Button
          label={passwordLoading ? "Збереження..." : "Змінити пароль"}
          hierarchy="primary"
          size="medium"
          shape="rectangle"
          onPress={handleChangePassword}
          disabled={passwordLoading}
          loading={passwordLoading}
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
        />
      </ModalContainer>

      {/* Notifications Modal */}
      <Modal
        visible={isNotificationsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsNotificationsModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
          <View style={{ height: insets.top, backgroundColor: theme.colors.background.primary }} />
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
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={notifStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={notifStyles.listSection}>
              <ListItem
                layout="switch"
                artworkSize="none"
                label="Push-сповіщення"
                subLabel="Дозвіл на надсилання сповіщень"
                switchValue={notifSettings?.enabled ?? isPushEnabled}
                showDivider={true}
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
              {[
                {
                  label: "Повітряна тривога",
                  value: notifSettings?.airAlerts ?? true,
                  key: "airAlerts",
                },
                {
                  label: "Оновлення статусів у Колі",
                  value: notifSettings?.statusUpdates ?? true,
                  key: "statusUpdates",
                },
                {
                  label: "Статус «Невідомо» під час тривоги",
                  value: notifSettings?.unknownStatusAlerts ?? true,
                  key: "unknownStatusAlerts",
                },
                {
                  label: "Нагадування про статус",
                  value: notifSettings?.statusUpdateReminders ?? true,
                  key: "statusUpdateReminders",
                },
                {
                  label: "Нагадування про настрій",
                  value: notifSettings?.moodReminders ?? true,
                  key: "moodReminders",
                },
                {
                  label: "SMS-сповіщення без інтернету",
                  value: notifSettings?.smsFallover ?? false,
                  key: "smsFallover",
                },
                {
                  label: "SMS про безпеку",
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
          </ScrollView>
        </View>
      </Modal>

      {/* Confirmation modals */}
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
      <ConfirmationModal
        isVisible={isDeleteAccountVisible}
        onCancel={() => setIsDeleteAccountVisible(false)}
        onConfirm={async () => {
          setIsDeleteAccountVisible(false);
          try {
            await apiFetch("/users", { method: "DELETE" });
            logout();
          } catch {
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
          } catch {
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: 120,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.opaque,
    gap: theme.spacing[8],
  },
  screenHeaderTitle: {
    flex: 1,
  },
  headerContainer: {
    alignItems: "center",
    paddingTop: theme.spacing[20],
    paddingBottom: theme.spacing[32],
  },
  avatarButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing[16],
    marginBottom: theme.spacing[16],
    width: "100%",
  },
  block: { marginBottom: theme.spacing[16] },
  profileName: {
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[32],
    textAlign: "center",
  },
  save: { marginTop: theme.spacing[8] },
  editContainer: {
    width: "100%",
    marginTop: theme.spacing[8],
  },
  cancelButton: { marginTop: theme.spacing[8] },
  settingsSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    marginBottom: theme.spacing[8],
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border.opaque,
    marginLeft: theme.spacing[16],
  },
  sectionLabel: {
    marginTop: theme.spacing[20],
    marginBottom: theme.spacing[8],
    marginLeft: theme.spacing[4],
    letterSpacing: 0.5,
  },
  logoutButton: {
    marginTop: theme.spacing[8],
    backgroundColor: theme.colors.background.secondary,
  },
});

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
    overflow: "hidden",
  },
});
