import { Button } from "@/src/components/Button";
import { ListItem } from "@/src/components/ListItem";
import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { ScreenIds } from "@/src/utils/testIDs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifSettings } from "../../../hooks/settings/useNotifSettings";
import { useFcmToken } from "../../../hooks/useFcmToken";
import { useToast } from "../../../hooks/useToast";

type NotificationSectionItem = {
  key: string;
  label: string;
  supportCaption?: string;
  defaultValue: boolean;
};

type NotificationSection = {
  title: string;
  items: NotificationSectionItem[];
};

const NOTIFICATION_SECTIONS: NotificationSection[] = [
  {
    title: "ПОВІТРЯНА ТРИВОГА",
    items: [
      {
        key: "airAlerts",
        label: "Отримувати сповіщення, коли у вашому регіоні повітряна тривога",
        defaultValue: true,
      },
      {
        key: "statusUpdates",
        label: "Отримувати сповіщення про статус членів Кола",
        supportCaption: "Повідомляти, коли хтось має статус “В безпеці” або “Потрібна допомога”",
        defaultValue: true,
      },
      {
        key: "unknownStatusAlerts",
        label: "Отримувати сповіщення, коли у когось стан залишається “Невідомо” під час тривоги",
        defaultValue: true,
      },
    ],
  },
  {
    title: "НАГАДУВАННЯ",
    items: [
      {
        key: "statusUpdateReminders",
        label: "Нагадувати оновити статус під час тривоги",
        defaultValue: true,
      },
    ],
  },
  {
    title: "SMS",
    items: [
      {
        key: "smsFallover",
        label: "Отримувати SMS лише тоді, коли немає інтернету, але є важливе сповіщення.",
        defaultValue: false,
      },
      {
        key: "smsSafetyStatus",
        label: "SMS для статусу безпеки",
        supportCaption:
          "Повідомляти, коли хтось із близьких позначився як “В безпеці” або “Потрібна допомога”",
        defaultValue: false,
      },
    ],
  },
] as const;

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.settingsSection}>
          <ListItem
            layout="switch"
            artworkSize="none"
            label="Push-сповіщення"
            supportCaption="Дозвіл на надсилання сповіщень"
            switchValue={notifSettings?.enabled ?? isPushEnabled}
            showDivider={false}
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
        </View>

        {NOTIFICATION_SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <Typography variant="subtitle2" tone="secondary" style={styles.sectionLabel}>
              {section.title}
            </Typography>

            <View style={styles.settingsSection}>
              {section.items.map((item, index) => (
                <ListItem
                  key={item.key}
                  layout="switch"
                  artworkSize="none"
                  label={item.label}
                  supportCaption={item.supportCaption}
                  switchValue={notifSettings?.[item.key] ?? item.defaultValue}
                  onSwitchChange={(val) => updateNotifSetting(item.key, val)}
                  showDivider={index < section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}
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
  scrollContent: {
    paddingHorizontal: theme.spacing[16],
    paddingTop: theme.spacing[16],
  },
  settingsSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
  },
  sectionBlock: {
    marginTop: theme.spacing[20],
  },
  sectionLabel: {
    marginBottom: theme.spacing[8],
    marginLeft: theme.spacing[4],
    letterSpacing: 0.5,
  },
});
