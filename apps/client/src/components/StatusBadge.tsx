import { theme } from "@/src/theme/theme";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Typography } from "./typography/Typography";

export type StatusBadgeVariant = "round" | "pill";
export type UserStatus = "SAFE" | "DANGER" | "UNKNOWN";

export const STATUS_CONFIG: Record<
  UserStatus,
  {
    bg: string;
    icon: string;
    label: string;
    mcIcon: keyof typeof FontAwesome6.glyphMap;
    iconColor?: string;
    showCircle?: boolean;
  }
> = {
  SAFE: {
    bg: theme.colors.stateBackground.safe,
    icon: theme.colors.state.safe,
    label: "В безпеці",
    mcIcon: "check",
    showCircle: true,
  },
  DANGER: {
    bg: theme.colors.stateBackground.emergency,
    icon: theme.colors.state.emergency,
    label: "Потрібна допомога!",
    mcIcon: "triangle-exclamation",
    iconColor: theme.colors.state.emergency,
    showCircle: false,
  },
  UNKNOWN: {
    bg: theme.colors.stateBackground.unknown,
    icon: theme.colors.state.unknown,
    label: "Невідомо",
    mcIcon: "question",
    showCircle: true,
  },
};

interface StatusBadgeProps {
  status: UserStatus;
  variant?: StatusBadgeVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = "round" }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNKNOWN;

  const roundBadge = (
    <View style={[styles.roundOuter, { backgroundColor: config.bg }]}>
      {config.showCircle ? (
        <View style={[styles.roundInner, { backgroundColor: config.icon }]}>
          <FontAwesome6 name={config.mcIcon} size={16} color="white" />
        </View>
      ) : (
        <FontAwesome6 name={config.mcIcon} size={24} color={config.iconColor ?? config.icon} />
      )}
    </View>
  );

  if (variant === "round") return roundBadge;

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
