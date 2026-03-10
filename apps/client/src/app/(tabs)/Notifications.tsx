import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Typography variant="h2" tone="primary" style={styles.header}>
          Сповіщення
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  scrollContent: { padding: theme.spacing[16], paddingBottom: theme.spacing[104] },
  header: { marginBottom: theme.spacing[24] },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[16],
    marginBottom: theme.spacing[24],
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.background.tertiary,
  },
});
