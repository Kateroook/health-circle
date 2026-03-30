import { theme } from "@/src/theme/theme";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { TextTone, TextVariant, Typography } from "./typography";

export type ButtonHierarchy = "primary" | "secondary" | "tertiary" | "accent";
export type ButtonSize = "large" | "medium" | "small" | "xsmall";
export type ButtonShape = "rectangle" | "pill" | "round";

interface ButtonProps {
  label?: string;
  hierarchy?: ButtonHierarchy;
  size?: ButtonSize;
  shape?: ButtonShape;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testId?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  hierarchy = "primary",
  size = "medium",
  shape = "rectangle",
  leadingIcon,
  trailingIcon,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  testId,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading || internalLoading;

  const isRound = shape === "round";

  const handlePress = async () => {
    if (onPress) {
      setInternalLoading(true);
      try {
        await onPress();
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const containerStyles = [
    styles.base,
    styles[`hierarchy_${hierarchy}`],
    styles[`size_${size}`],
    styles[`shape_${shape}`],
    isRound && styles.roundBase,
    isRound && styles[`roundSize_${size}`],
    disabled && (hierarchy === "tertiary" ? styles.disabled_tertiary : styles.disabled),
    style,
  ];

  const getLabelVariant = (): TextVariant => {
    switch (size) {
      case "large":
        return "h3";
      case "medium":
        return "subtitle1";
      case "small":
        return "subtitle1";
      case "xsmall":
        return "caption";
      default:
        return "subtitle1";
    }
  };

  const getLabelTone = (): TextTone => {
    if (disabled) return "stateDisable";
    switch (hierarchy) {
      case "primary":
      case "accent":
        return "onColor";
      case "secondary":
      case "tertiary":
      default:
        return "primary";
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={
            hierarchy === "primary" || hierarchy === "accent"
              ? theme.colors.content.onColor
              : theme.colors.content.onColorInverse
          }
        />
      );
    }

    return (
      <View style={styles.contentWrapper}>
        {isRound ? (
          leadingIcon
        ) : (
          <>
            {leadingIcon && <View style={styles.iconLeading}>{leadingIcon}</View>}
            {label && (
              <Typography
                variant={getLabelVariant()}
                tone={getLabelTone()}
                style={[styles.label, textStyle]}
                weight={size === "large" ? "bold" : "semibold"}
              >
                {label}
              </Typography>
            )}
            {trailingIcon && <View style={styles.iconTrailing}>{trailingIcon}</View>}
          </>
        )}
      </View>
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isLoading}
      testID={testId}
      accessibilityLabel={testId}
      style={({ pressed }) => [
        ...containerStyles,
        pressed && !disabled && !isLoading && styles.pressed,
      ]}
    >
      {renderContent()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  roundBase: {
    aspectRatio: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  // Hierarchy
  hierarchy_primary: {
    backgroundColor: theme.colors.primaryB,
  },
  hierarchy_secondary: {
    backgroundColor: theme.colors.background.tertiary,
  },
  hierarchy_tertiary: {
    backgroundColor: "transparent",
  },
  hierarchy_accent: {
    backgroundColor: theme.colors.accent,
  },
  // Size
  size_large: {
    paddingVertical: theme.spacing[16],
    paddingHorizontal: theme.spacing[24],
    minHeight: 56,
  },
  size_medium: {
    paddingVertical: theme.spacing[12],
    paddingHorizontal: theme.spacing[20],
    minHeight: 48,
  },
  size_small: {
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[16],
    height: 36,
  },
  size_xsmall: {
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[12],
    minHeight: 28,
  },
  // Round size overrides:
  roundSize_large: { width: 56, height: 56 },
  roundSize_medium: { width: 48, height: 48 },
  roundSize_small: { width: 36, height: 36 },
  roundSize_xsmall: { width: 28, height: 28 },
  // Shape
  shape_rectangle: {
    borderRadius: theme.radius.lg,
  },
  shape_pill: {
    borderRadius: theme.radius.pill,
  },
  shape_round: {
    borderRadius: theme.radius.circle,
  },
  // States
  disabled: {
    backgroundColor: theme.colors.background.stateDisable,
  },
  disabled_tertiary: {
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.8,
  },
  // Content
  label: {
    textAlign: "center",
    marginBottom: 0,
  },
  iconLeading: {
    marginRight: theme.spacing[8],
  },
  iconTrailing: {
    marginLeft: theme.spacing[8],
  },
});
