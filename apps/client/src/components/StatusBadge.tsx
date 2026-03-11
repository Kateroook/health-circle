import { theme } from "@/src/theme/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Typography } from "./typography/Typography";

export type StatusBadgeVariant = "round" | "pill";
export type UserStatus = "SAFE" | "DANGER" | "UNKNOWN";

export const STATUS_CONFIG: Record<UserStatus, { bg: string; icon: string; label: string }> = {
  SAFE: {
    bg: theme.colors.stateBackground.safe,
    icon: theme.colors.state.safe,
    label: "В безпеці",
  },
  DANGER: {
    bg: theme.colors.stateBackground.emergency,
    icon: theme.colors.state.emergency,
    label: "Потрібна допомога!",
  },
  UNKNOWN: {
    bg: theme.colors.stateBackground.unknown,
    icon: theme.colors.state.unknown,
    label: "Невідомо",
  },
};

const STATUS_SYMBOL: Record<UserStatus, string> = {
  SAFE: "✓",
  DANGER: "!",
  UNKNOWN: "?",
};

interface StatusBadgeProps {
  status: UserStatus;
  variant?: StatusBadgeVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = "round" }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNKNOWN;

  const roundBadge = (
    <View style={[styles.roundOuter, { backgroundColor: config.bg }]}>
      <View style={[styles.roundInner, { backgroundColor: config.icon }]}>
        <Typography variant="subtitle1" tone="onColor" weight="bold">
          {STATUS_SYMBOL[status]}
        </Typography>
      </View>
    </View>
  );

  if (variant === "round") {
    return roundBadge;
  }

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      {roundBadge}
      <Typography variant="subtitle1" style={{ color: config.icon }}>
        {config.label}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  roundOuter: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.circle,
    padding: theme.spacing[12],
    justifyContent: "center",
    alignItems: "center",
  },
  roundInner: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.circle,
    justifyContent: "center",
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.pill,
    paddingRight: theme.spacing[16],
  },
});
