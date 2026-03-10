import { theme } from "@/src/theme/theme";
import React from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleProp,
  StyleSheet,
  TextStyle,
} from "react-native";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "subtitle1"
  | "subtitle2"
  | "body1"
  | "body2"
  | "caption";

export type TextTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "onColor"
  | "onColorInverse"
  | "accent"
  | "negative"
  | "positive"
  | "warning";

type TextWeight = "regular" | "semibold" | "bold";

type FontContext = "headings" | "body";

export interface TypographyProps extends Omit<RNTextProps, "style"> {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: TextWeight;
  style?: StyleProp<TextStyle>;
}

const FONT_FAMILY_BY_CONTEXT: Record<FontContext, Record<TextWeight, string>> = {
  headings: {
    regular: "Montserrat-Regular",
    semibold: "Montserrat-SemiBold",
    bold: "Montserrat-Bold",
  },
  body: {
    regular: "Karla-Regular",
    semibold: "Karla-SemiBold",
    bold: "Karla-Bold",
  },
};

const DEFAULT_WEIGHT_BY_VARIANT: Record<TextVariant, TextWeight> = {
  h1: "bold",
  h2: "bold",
  h3: "semibold",
  subtitle1: "semibold",
  subtitle2: "semibold",
  body1: "regular",
  body2: "regular",
  caption: "regular",
};

const getFontContextForVariant = (variant: TextVariant): FontContext => {
  switch (variant) {
    case "body1":
    case "body2":
    case "caption":
      return "body";
    default:
      return "headings";
  }
};

const baseVariantStyles: Record<TextVariant, TextStyle> = {
  h1: {
    fontSize: theme.typography.fontSize.h1,
    lineHeight: theme.typography.lineHeight.h1,
  },
  h2: {
    fontSize: theme.typography.fontSize.h2,
    lineHeight: theme.typography.lineHeight.h2,
  },
  h3: {
    fontSize: theme.typography.fontSize.h3,
    lineHeight: theme.typography.lineHeight.h3,
  },
  subtitle1: {
    fontSize: theme.typography.fontSize.subtitle1,
    lineHeight: theme.typography.lineHeight.subtitle1,
  },
  subtitle2: {
    fontSize: theme.typography.fontSize.subtitle2,
    lineHeight: theme.typography.lineHeight.subtitle2,
    textTransform: "uppercase",
  },
  body1: {
    fontSize: theme.typography.fontSize.body1,
    lineHeight: theme.typography.lineHeight.body1,
  },
  body2: {
    fontSize: theme.typography.fontSize.body2,
    lineHeight: theme.typography.lineHeight.body2,
  },
  caption: {
    fontSize: theme.typography.fontSize.caption,
    lineHeight: theme.typography.lineHeight.caption,
  },
};

const resolveToneColor = (tone: TextTone | undefined): string => {
  switch (tone) {
    case "secondary":
      return theme.colors.content.secondary;
    case "tertiary":
      return theme.colors.content.tertiary;
    case "onColor":
      return theme.colors.content.onColor;
    case "onColorInverse":
      return theme.colors.content.onColorInverse;
    case "accent":
      return theme.colors.accent;
    case "negative":
      return theme.colors.negative;
    case "positive":
      return theme.colors.positive;
    case "warning":
      return theme.colors.warning;
    case "primary":
    default:
      return theme.colors.content.primary;
  }
};

export const Typography: React.FC<TypographyProps> = ({
  variant = "body1",
  tone = "primary",
  weight,
  style,
  children,
  ...rest
}) => {
  const baseStyle = baseVariantStyles[variant];

  const context = getFontContextForVariant(variant);
  const resolvedWeight = weight ?? DEFAULT_WEIGHT_BY_VARIANT[variant];

  const fontStyle: TextStyle = {
    fontFamily: FONT_FAMILY_BY_CONTEXT[context][resolvedWeight],
  };

  const colorStyle: TextStyle = {
    color: resolveToneColor(tone),
  };

  const spacingStyle: TextStyle = {
    marginBottom:
      theme.typography.paragraphSpacing[
        variant as keyof typeof theme.typography.paragraphSpacing
      ] ?? 0,
  };

  return (
    <RNText
      {...rest}
      style={StyleSheet.flatten([baseStyle, fontStyle, colorStyle, spacingStyle, style])}
    >
      {children}
    </RNText>
  );
};
