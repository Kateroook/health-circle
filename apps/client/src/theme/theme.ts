/**
 * Centralized theme object for the app, containing design tokens and semantic colors.
 * Usage:
 *   import { theme } from "@src/theme";
 *
 *   <View style={{ backgroundColor: theme.colors.accent }} />
 */

import { effects } from "./effects";
import { borderWidth, colors, radius, semanticColors, spacing, typography } from "./tokens";

export const theme = {
  colors: {
    ...semanticColors,
    primitives: colors,
  },

  spacing,
  radius,
  borderWidth,
  typography,
  effects,
} as const;

export type Theme = typeof theme;
