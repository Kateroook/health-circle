import { Button } from "@/src/components/Button";
import { ListItem } from "@/src/components/ListItem";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenIds } from "@/src/utils/testIDs";
import { useFcmToken } from "../../../hooks/useFcmToken";
import { useToast } from "../../../hooks/useToast";
import { useNotifSettings } from "../../../hooks/settings/useNotifSettings";

export default function NotificationsScreen() {
  const { showToast } = useToast();
  const { requestPermission } = useFcmToken();
  const { notifSettings, isPushEnabled, setPushEnabled, updateNotifSetting } = useNotifSettings();

  return (
    <SafeAreaView
      style={styles.container}
      testID={ScreenIds.settingsNotifications}
      accessibilityLabel={ScreenIds.settingsNotifications}
    >
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
          testId="notifications:back:button"
        />
        <Typography variant="h3" tone="primary" style={styles.headerTitle}>
          Сповіщення
        </Typography>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listSection}>
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
              key={item.key}
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
  scrollContent: { padding: theme.spacing[16], paddingBottom: theme.spacing[40] },
  listSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
  },
});
