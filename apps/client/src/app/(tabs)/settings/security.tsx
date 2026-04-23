import { Button } from "@/src/components/Button";
import ConfirmationModal from "@/src/components/ConfirmationModal";
import { ListItem } from "@/src/components/ListItem";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { ScreenIds } from "@/src/utils/testIDs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../../api/api";
import { useNotifSettings } from "../../../hooks/settings/useNotifSettings";
import { useFcmToken } from "../../../hooks/useFcmToken";
import { useToast } from "../../../hooks/useToast";
import { useAuthStore } from "../../../store/authStore";

export default function SecurityScreen() {
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { requestPermission } = useFcmToken();
  const { notifSettings, isPushEnabled, setPushEnabled, updateNotifSetting } = useNotifSettings();

  const [isDeleteAccountVisible, setIsDeleteAccountVisible] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [contactsEnabled, setContactsEnabled] = useState(false);

  return (
    <SafeAreaView
      style={styles.container}
      testID={`${ScreenIds.settings}:security`}
      accessibilityLabel={`${ScreenIds.settings}:security`}
    >
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
          onPress={() => router.back()}
          testId="security:back:button"
        />
        <Typography variant="h3" tone="primary" style={styles.screenHeaderTitle}>
          Приватність та безпека
        </Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                  showToast({
                    type: "warning",
                    title: "Дозвіл не отримано",
                    subtitle: "Будь ласка, дозвольте сповіщення у налаштуваннях пристрою.",
                  });
                  return;
                }
              }
              setPushEnabled(val);
              updateNotifSetting("enabled", val);
            }}
            testId="security:pushNotifications:switch"
          />
          <ListItem
            layout="switch"
            artworkSize="none"
            label="SMS-сповіщення"
            subLabel="Може стягуватись тариф твого оператора"
            switchValue={notifSettings?.smsFallover ?? false}
            showDivider={true}
            onSwitchChange={(val) => updateNotifSetting("smsFallover", val)}
            testId="security:smsNotifications:switch"
          />
          <ListItem
            layout="switch"
            artworkSize="none"
            label="Геолокація"
            subLabel="Локація надсилається лише після натискання «Потрібна допомога»"
            switchValue={locationEnabled}
            showDivider={true}
            onSwitchChange={setLocationEnabled}
            testId="security:location:switch"
          />
          <ListItem
            layout="switch"
            artworkSize="none"
            label="Доступ до контактів"
            switchValue={contactsEnabled}
            showDivider={false}
            onSwitchChange={setContactsEnabled}
            testId="security:contacts:switch"
          />
        </View>

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
            onPress={() => router.push("/settings/change-password")}
            testId="security:changePassword:button"
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
            testId="security:deleteAccount:button"
          />
        </View>
      </ScrollView>

      <ConfirmationModal
        isVisible={isDeleteAccountVisible}
        onCancel={() => setIsDeleteAccountVisible(false)}
        onConfirm={async () => {
          setIsDeleteAccountVisible(false);
          try {
            await apiFetch("/users", { method: "DELETE" });
            showToast({ type: "success", title: "Акаунт видалено", compact: true });
            logout();
          } catch {
            showToast({
              type: "error",
              title: "Помилка",
              subtitle: "Не вдалося видалити акаунт",
            });
          }
        }}
        title="Видалити акаунт?"
        message="Після видалення акаунта всі кола та контакти будуть безповоротно видалені"
        confirmText="Видалити"
        cancelText="Назад"
        confirmStyle="default"
        testId="settings:deleteAccount:modal"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  scrollContent: { paddingHorizontal: theme.spacing[16], paddingBottom: 120 },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.opaque,
    gap: theme.spacing[8],
  },
  screenHeaderTitle: { flex: 1 },
  settingsSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    marginBottom: theme.spacing[8],
  },
  sectionLabel: {
    marginTop: theme.spacing[20],
    marginBottom: theme.spacing[8],
    marginLeft: theme.spacing[4],
    letterSpacing: 0.5,
  },
});
