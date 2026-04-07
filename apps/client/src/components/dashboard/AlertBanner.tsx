import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { ActiveAlert } from "@/src/types";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

interface AlertBannerProps {
  alert: ActiveAlert;
  testId?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert, testId }) => {
  return (
    <View
      style={styles.alertBanner}
      accessibilityRole="alert"
      testID={testId}
      accessibilityLabel={testId}
    >
      <View style={styles.alertBannerIcon}>
        <Feather name="alert-triangle" size={18} color={theme.colors.negative} />
      </View>
      <View style={styles.alertBannerText}>
        <Typography variant="subtitle1" tone="primary" style={styles.alertBannerTitle}>
          {alert.alertType}
        </Typography>
        <Typography variant="body2" tone="secondary" style={styles.alertBannerSubtitle}>
          {alert.regionName}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  alertBanner: {
    marginTop: theme.spacing[12],
    marginBottom: theme.spacing[12],
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.lightNegative,
    borderColor: theme.colors.border.negative,
    borderWidth: theme.borderWidth.xs,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[12],
  },
  alertBannerIcon: {
    marginRight: theme.spacing[12],
    width: 32,
    height: 32,
    borderRadius: theme.radius.circle,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background.secondary,
  },
  alertBannerText: {
    flex: 1,
  },
  alertBannerTitle: {
    marginBottom: 2,
  },
  alertBannerSubtitle: {
    marginBottom: 0,
  },
});
