import { Button } from "@/src/components/Button";
import { PasswordField } from "@/src/components/fields/TextField";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Image, Modal, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../../api/api";
import { formatErrorMessage } from "../../../utils/error.util";

const { width, height } = Dimensions.get("window");

export default function ChangePasswordScreen() {
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

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
      setShowPasswordSuccess(true);
    } catch (e: any) {
      setPasswordError(formatErrorMessage(e, "Не вдалося змінити пароль"));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
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
          testId="changePassword:back:button"
        />
        <Typography variant="h3" tone="primary" style={styles.headerTitle}>
          Змінити пароль
        </Typography>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <PasswordField
          label="Поточний пароль"
          required
          placeholder="Введіть поточний пароль"
          value={oldPassword}
          onChangeText={setOldPassword}
          testId="changePassword:oldPassword:input"
        />
        <PasswordField
          label="Новий пароль"
          required
          placeholder="Новий пароль (мін. 12 символів)"
          value={newPassword}
          onChangeText={setNewPassword}
          caption="Має містити щонайменше 12 символів"
          testId="changePassword:newPassword:input"
        />
        <PasswordField
          label="Підтвердіть новий пароль"
          required
          placeholder="Повторно введіть новий пароль"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          errorMessage={passwordError || undefined}
          testId="changePassword:confirmNewPassword:input"
        />
        <Button
          label={passwordLoading ? "Збереження..." : "Змінити пароль"}
          hierarchy="primary"
          size="medium"
          shape="rectangle"
          onPress={handleChangePassword}
          disabled={passwordLoading}
          loading={passwordLoading}
          style={{ marginTop: theme.spacing[8] }}
          testId="changePassword:submit:button"
        />
      </ScrollView>

      {/* Embedded Success Modal - could also be a separate screen, but a modal prevents accidental back nav on success */}
      <Modal
        visible={showPasswordSuccess}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowPasswordSuccess(false);
          router.back();
        }}
      >
        <SafeAreaView style={styles.successContainer}>
          <Typography variant="h2" tone="primary" style={styles.successTitle}>
            Пароль змінено
          </Typography>
          <Image
            source={require("./../../../assets/images/interactiveScreens/password_change.png")}
            style={styles.successImage}
            resizeMode="contain"
          />
          <Button
            label="Ок"
            hierarchy="primary"
            size="large"
            shape="pill"
            onPress={() => {
              setShowPasswordSuccess(false);
              router.back();
            }}
            style={styles.successButton}
            testId="changePasswordSuccess:ok:button"
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  scrollContent: { padding: theme.spacing[16], gap: theme.spacing[16] },
  successContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing[24],
    paddingTop: theme.spacing[64],
    paddingBottom: theme.spacing[40],
  },
  successTitle: { textAlign: "center" },
  successImage: { width: width * 0.417, maxHeight: height * 0.235 },
  successButton: { width: "100%" },
});
