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

  // Modal states
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);
  const [isSecurityModalVisible, setIsSecurityModalVisible] = useState(false);

  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(false);
  const [toggle3, setToggle3] = useState(false);
  const [toggle4, setToggle4] = useState(false);
  const [toggle5, setToggle5] = useState(false);
  const [toggle6, setToggle6] = useState(false);
  const [toggle7, setToggle7] = useState(false);

  const [securityToggle1, setSecurityToggle1] = useState(false);
  const [securityToggle2, setSecurityToggle2] = useState(false);
  const [securityToggle3, setSecurityToggle3] = useState(false);
  const [securityToggle4, setSecurityToggle4] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [contactsEnabled, setContactsEnabled] = useState(false);

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

  const ToggleRow = ({
    label,
    sublabel,
    value,
    onValueChange,
  }: {
    label: string;
    sublabel?: string; // необов'язковий підтекст
    value: boolean;
    onValueChange: (newValue: boolean) => void;
  }) => (
    <View
      style={{
        paddingVertical: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text
          style={{
            fontSize: 16,
            color: "#000000",
            flex: 1,
            paddingRight: 16,
            lineHeight: 22,
          }}
        >
          {label}
        </Text>
        <CustomToggle value={value} onValueChange={onValueChange} />
      </View>

      {sublabel && (
        <Text
          style={{
            fontSize: 13,
            color: "#666666",
            marginTop: 4,
            lineHeight: 18,
          }}
        >
          {sublabel}
        </Text>
      )}
    </View>
  );

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
          backgroundColor: value ? "#000000" : "#E0E0E0", // активний — чорний, неактивний — сірий
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
          {value ? (
            <Text
              style={{
                color: "#000000", // біла галочка на чорному фоні тоггла
                fontSize: 18,
                fontWeight: "bold",
                lineHeight: 20,
              }}
            >
              ✓
            </Text>
          ) : (
            <Text
              style={{
                color: "#E0E0E0", // світло-сірий хрестик
                fontSize: 18,
                fontWeight: "bold",
                lineHeight: 20,
              }}
            >
              ✕
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
          <Text style={styles.profileName}>{user?.firstName}</Text>

          {!isEditMode && (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditMode(true)}>
              <Icon name="edit-2" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.editButtonText}>Редагувати</Text>
            </TouchableOpacity>
          )}

          {isEditMode && (
            <View style={styles.editContainer}>
              <View style={styles.avatarButtons}>
                <TouchableOpacity style={styles.avatarButton} onPress={handlePickAvatar}>
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

              {fields.map((field) => (
                <View key={field.label} style={styles.block}>
                  <Text style={styles.label}>
                    {field.label}
                    {field.required ? (
                      <Text style={styles.requiredStar}> *</Text>
                    ) : (
                      <Text style={styles.optionalText}> (опціонально)</Text>
                    )}
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
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditMode(false);
                  setFirstName(user?.firstName || "");
                  setMiddleName(user?.middleName || "");
                  setLastName(user?.lastName || "");
                  setPhone(user?.phone || "");
                }}
              >
                <Text style={styles.cancelButtonText}>Скасувати</Text>
              </TouchableOpacity>
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
            color="#000000"
            style={{ marginRight: 12 }}
          />
          <Text style={styles.notificationsHeaderText}>Сповіщення</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#000000"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.securityHeader}
          onPress={() => setIsSecurityModalVisible(true)}
        >
          <MaterialCommunityIcons
            name="shield-lock"
            size={24}
            color="#000000"
            style={{ marginRight: 12 }}
          />
          <Text style={styles.securityHeaderText}>Приватність та безпека</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#000000"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialCommunityIcons
            name="door-open"
            size={24}
            color="#000000"
            style={{ marginRight: 12 }}
          />
          <Text style={styles.logoutTextNew}>Вийти</Text>
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

      {/* Notifications Modal */}
      <Modal
        visible={isNotificationsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsNotificationsModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
          {/* Заголовок */}
          <View
            style={{
              height: 56,
              backgroundColor: "#F5F5F7",
              borderBottomWidth: 1,
              borderBottomColor: "#E0E0E0",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#000000",
                textAlign: "center",
              }}
            >
              Сповіщення
            </Text>
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

          {/* Контент */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            {/* Група 1 */}
            <Text style={styles.sectionHeader}>ПОВІТРЯНА ТРИВОГА</Text>

            <View style={styles.card}>
              <ToggleRow
                label="Отримувати сповіщення, коли у вашому районі повітряна тривога"
                value={toggle1}
                onValueChange={setToggle1}
              />
            </View>

            <View style={styles.card}>
              <ToggleRow
                label="Отримувати сповіщення про статус членів Кола"
                sublabel="Повідомляти, коли хтось має статус «В безпеці» або «Потрібна допомога»"
                value={toggle2}
                onValueChange={setToggle2}
              />
            </View>

            <View style={styles.card}>
              <ToggleRow
                label='Отримувати сповіщення, коли у когось стан залишається "Невідомо" під час тривоги'
                value={toggle3}
                onValueChange={setToggle3}
              />
            </View>

            {/* Група 2 */}
            <Text style={styles.sectionHeader}>НАГАДУВАННЯ</Text>

            <View style={styles.card}>
              <ToggleRow
                label="Нагадувати оновити статус під час тривоги"
                value={toggle4}
                onValueChange={setToggle4}
              />
            </View>

            <View style={styles.card}>
              <ToggleRow
                label="Нагадувати позначити настрій"
                value={toggle5}
                onValueChange={setToggle5}
              />
            </View>

            {/* Група 3 */}
            <Text style={styles.sectionHeader}>SMS</Text>

            <View style={styles.card}>
              <ToggleRow
                label="Отримувати SMS лише тоді, коли немає інтернету, але є важливе сповіщення"
                value={toggle6}
                onValueChange={setToggle6}
              />
            </View>

            <View style={styles.card}>
              <ToggleRow
                label="SMS для статусу безпеки"
                sublabel="Повідомляти, коли хтось із близьких позначився як «В безпеці» або «Потрібна допомога»"
                value={toggle7}
                onValueChange={setToggle7}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Security & Privacy Modal */}
      <Modal
        visible={isSecurityModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsSecurityModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
          {/* Заголовок */}
          <View
            style={{
              height: 56,
              backgroundColor: "#F5F5F7",
              borderBottomWidth: 1,
              borderBottomColor: "#E0E0E0",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#000000",
                textAlign: "center",
              }}
            >
              Приватність та безпека
            </Text>
            <TouchableOpacity
              onPress={() => setIsSecurityModalVisible(false)}
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

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingBottom: 40,
            }}
          >
            {/* Група налаштувань приватності */}
            <Text style={styles.sectionHeader}>ДОЗВОЛИ СИСТЕМИ</Text>

            <View style={styles.card}>
              <ToggleRow
                label="Push-сповіщення"
                value={securityToggle1}
                onValueChange={setSecurityToggle1}
              />
            </View>

            <View style={styles.card}>
              <ToggleRow
                label="SMS-сповіщення"
                sublabel="Може стягуватись тариф твого оператора"
                value={securityToggle2}
                onValueChange={setSecurityToggle2}
              />
            </View>

            <View style={styles.card}>
              <ToggleRow
                label="Геолокація"
                sublabel="Локація надсилається лише після натискання «Потрібна допомога»"
                value={securityToggle3}
                onValueChange={setSecurityToggle3}
              />
            </View>

            <View style={styles.card}>
              <ToggleRow
                label="Доступ до контактів"
                value={securityToggle4}
                onValueChange={setSecurityToggle4}
              />
            </View>

            {/* Група Обліковий запис – внизу */}
            <Text style={[styles.sectionHeader, { marginTop: 32 }]}>ОБЛІКОВИЙ ЗАПИС</Text>

            <View style={styles.card}>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 16,
                }}
                onPress={() => {
                  setIsSecurityModalVisible(false);
                  setShowPasswordModal(true);
                }}
              >
                <Text style={styles.securityItemText}>Змінити пароль</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 16,
                }}
                onPress={() => {
                  setIsSecurityModalVisible(false);
                  handleDeleteAccount();
                }}
              >
                <Text style={[styles.securityItemText, { color: "#D32F2F" }]}>Видалити акаунт</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  headerContainer: { alignItems: "center", marginBottom: 30, padding: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginTop: 10, marginBottom: 10 },
  avatarButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
    width: "100%",
  },
  avatarButton: {
    backgroundColor: "#5B8DEE",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
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
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginTop: 12,
    marginBottom: 8,
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
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  securityHeaderText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    marginHorizontal: 20,
  },
  logoutTextNew: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B8DEE",
    paddingVertical: 16,
    paddingHorizontal: 100,
    borderRadius: 15,
    marginTop: 16,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  editButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
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
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  securityItemText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 0,
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
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#666666",
    marginTop: 24,
    marginBottom: 8,
    paddingLeft: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
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
  optionalText: {
    fontSize: 14,
    color: "#999",
  },
});
