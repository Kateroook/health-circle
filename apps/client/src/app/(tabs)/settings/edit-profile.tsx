import { Avatar } from "@/src/components/Avatar";
import { Button } from "@/src/components/Button";
import ConfirmationModal from "@/src/components/ConfirmationModal";
import { HromadaPicker } from "@/src/components/fields/HromadaPicker";
import { PhoneInput } from "@/src/components/fields/PhoneInput";
import { RegionPicker } from "@/src/components/fields/RegionPicker";
import { TextField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch, apiUploadFile, getAvatarUrl } from "../../../api/api";
import { useToast } from "../../../hooks/useToast";
import { useAuthStore } from "../../../store/authStore";
import { cleanObj } from "../../../utils/clean.util";

export default function EditProfileScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [region, setRegion] = useState(user?.region || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [alertRegionUid, setAlertRegionUid] = useState<number | null>(user?.alertRegionUid ?? null);
  const [alertRegionName, setAlertRegionName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isDeleteAvatarVisible, setIsDeleteAvatarVisible] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName || "");
    setMiddleName(user?.middleName || "");
    setLastName(user?.lastName || "");
    setPhone(user?.phone || "");
    setRegion(user?.region || "");
    setDistrict(user?.district || "");
    setAlertRegionUid(user?.alertRegionUid ?? null);
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
      showToast({
        type: "error",
        title: "Помилка",
        subtitle: errors.join("\n"),
      });
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
            region: region.trim(),
            district: district.trim(),
            email: user?.email,
            ...(alertRegionUid != null ? { alertRegionUid } : {}),
          }),
        ),
      });
      showToast({ type: "success", title: "Дані оновлено" });
      await refreshProfile();
      router.back();
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Помилка",
        subtitle: e?.message || "Не вдалося оновити дані",
      });
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
        showToast({ type: "success", title: "Аватар оновлено", compact: true });
      } catch (e: any) {
        showToast({
          type: "error",
          title: "Помилка",
          subtitle: e?.message || "Не вдалося оновити аватар",
        });
      }
    }
  };

  const fields = [
    {
      id: "lastName",
      label: "Прізвище",
      value: lastName,
      setter: setLastName,
      placeholder: "Введіть прізвище",
      maxLength: 50,
      required: true,
    },
    {
      id: "firstName",
      label: "Імʼя",
      value: firstName,
      setter: setFirstName,
      placeholder: "Введіть імʼя",
      maxLength: 50,
      required: true,
    },
    {
      id: "middleName",
      label: "По батькові",
      value: middleName,
      setter: setMiddleName,
      placeholder: "Введіть по батькові",
      maxLength: 50,
      required: false,
    },
    {
      id: "phone",
      label: "Номер телефону",
      value: phone,
      setter: setPhone,
      placeholder: "+380...",
      keyboardType: "phone-pad",
      required: true,
    },
    {
      id: "region",
      label: "Область",
      value: region,
      setter: setRegion,
      placeholder: "Львівська область",
      required: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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
          onPress={() => router.back()}
          testId="editProfile:back:button"
        />
        <Typography variant="h3" tone="primary" style={styles.headerTitle}>
          Редагувати профіль
        </Typography>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarContainer}>
          <Avatar
            userId={user?.id ?? ""}
            avatarUpdatedAt={user?.avatarUpdatedAt}
            size="xl"
            showOuterRing={true}
          />
        </View>

        <View style={styles.avatarButtons}>
          <Button
            label="Змінити аватар"
            hierarchy="secondary"
            size="small"
            shape="rectangle"
            onPress={handlePickAvatar}
            testId="editProfile:changeAvatar:button"
          />
          {avatarUrl && !imageError && (
            <Button
              label="Видалити аватар"
              hierarchy="secondary"
              size="small"
              shape="rectangle"
              onPress={() => setIsDeleteAvatarVisible(true)}
              testId="editProfile:deleteAvatar:button"
            />
          )}
        </View>

        {fields.map((field) => (
          <View key={field.id} style={styles.block}>
            {field.id === "phone" ? (
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
                  testId="editProfile:phone:input"
                />
              </View>
            ) : field.id === "region" ? (
              <RegionPicker
                label={field.label}
                value={field.value}
                onSelect={field.setter}
                placeholder={field.placeholder}
              />
            ) : (
              <TextField
                label={field.label}
                required={field.required}
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                keyboardType={field.keyboardType as any}
                maxLength={field.maxLength}
                testId={`editProfile:${field.id}:input`}
              />
            )}
          </View>
        ))}

        <View style={styles.block}>
          <HromadaPicker
            label="Громада / Населений пункт (для тривог)"
            value={alertRegionName}
            onSelect={(uid, name) => {
              setAlertRegionUid(uid);
              setAlertRegionName(name);
            }}
            placeholder="Оберіть громаду для точних тривог"
          />
        </View>

        <Button
          label="Зберегти"
          hierarchy="primary"
          size="medium"
          shape="rectangle"
          onPress={handleSave}
          style={styles.save}
          testId="editProfile:save:button"
        />
      </ScrollView>

      <ConfirmationModal
        isVisible={isDeleteAvatarVisible}
        onCancel={() => setIsDeleteAvatarVisible(false)}
        onConfirm={async () => {
          setIsDeleteAvatarVisible(false);
          try {
            await apiFetch(`/users/${user?.id}/avatar`, { method: "DELETE" });
            updateUser({ avatarUpdatedAt: undefined });
            setAvatarUrl(null);
            showToast({ type: "success", title: "Аватар видалено", compact: true });
          } catch {
            showToast({
              type: "error",
              title: "Помилка",
              subtitle: "Не вдалося видалити аватар",
            });
          }
        }}
        title="Видалити аватар?"
        message="Ви впевнені, що хочете видалити фото профілю?"
        confirmText="Видалити"
        cancelText="Скасувати"
        testId="editProfile:deleteAvatar:modal"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.opaque,
  },
  headerTitle: { flex: 1, textAlign: "center" },
  scrollContent: { padding: theme.spacing[16], paddingBottom: 120 },
  avatarContainer: {
    alignItems: "center",
    paddingBottom: theme.spacing[16],
  },
  avatarButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing[16],
    marginBottom: theme.spacing[24],
    width: "100%",
  },
  block: { marginBottom: theme.spacing[16] },
  save: { marginTop: theme.spacing[16] },
});
