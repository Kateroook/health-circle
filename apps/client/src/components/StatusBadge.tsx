import { theme } from "@/src/theme/theme";
import { FontAwesome6 } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Typography } from "./typography/Typography";

import { UserStatus } from "../types";
export { UserStatus };

export type StatusBadgeVariant = "round" | "pill";
type IconConfig =
  | { iconLib: "fa6"; mcIcon: keyof typeof FontAwesome6.glyphMap }
  | { iconLib: "mci"; mcIcon: keyof typeof MaterialCommunityIcons.glyphMap };

export const STATUS_CONFIG: Record<
  UserStatus,
  {
    bg: string;
    icon: string;
    label: string;
    iconColor?: string;
    showCircle?: boolean;
  } & IconConfig
> = {
  SAFE: {
    bg: theme.colors.stateBackground.safe,
    icon: theme.colors.state.safe,
    label: "В безпеці",
    iconLib: "fa6",
    mcIcon: "check",
    showCircle: true,
  },
  DANGER: {
    bg: theme.colors.stateBackground.emergency,
    icon: theme.colors.state.emergency,
    label: "Потрібна допомога!",
    iconLib: "fa6",
    mcIcon: "triangle-exclamation",
    iconColor: theme.colors.state.emergency,
    showCircle: false,
  },
  UNKNOWN: {
    bg: theme.colors.stateBackground.unknown,
    icon: theme.colors.state.unknown,
    label: "Невідомо",
    iconLib: "fa6",
    mcIcon: "question",
    showCircle: true,
  },
  WAS_SAFE: {
    bg: theme.colors.stateBackground.beenSafe,
    icon: theme.colors.state.beenSafe,
    label: "Був у безпеці",
    iconLib: "mci",
    mcIcon: "progress-check",
    showCircle: false,
  },
};

interface StatusBadgeProps {
  status: UserStatus;
  variant?: StatusBadgeVariant;
  testId?: string;
}

const StatusIcon = ({
  config,
  size,
  color,
}: {
  config: (typeof STATUS_CONFIG)[UserStatus];
  size: number;
  color: string;
}) => {
  if (config.iconLib === "mci") {
    return <MaterialCommunityIcons name={config.mcIcon} size={size} color={color} />;
  }
  return <FontAwesome6 name={config.mcIcon} size={size} color={color} />;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = "round", testId }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNKNOWN;
  const finalTestId = testId ?? `statusBadge:${status}`;

  const roundBadge = (
    <View
      testID={variant === "round" ? finalTestId : undefined}
      accessibilityLabel={variant === "round" ? finalTestId : undefined}
      style={[styles.roundOuter, { backgroundColor: config.bg }]}
    >
      {config.showCircle ? (
        <View style={[styles.roundInner, { backgroundColor: config.icon }]}>
          <StatusIcon config={config} size={12} color="white" />
        </View>
      ) : (
        <StatusIcon config={config} size={24} color={config.iconColor ?? config.icon} />
      )}
    </View>
  );

  if (variant === "round") return roundBadge;

  return (
    <View
      testID={testId}
      accessibilityLabel={testId}
      style={[styles.pill, { backgroundColor: config.bg }]}
    >
      {roundBadge}
      <Typography
        variant="subtitle1"
        style={{ color: config.icon }}
        testID={testId ? `${testId}:label` : `statusBadge:${status}:label`}
        importantForAccessibility="yes"
      >
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
