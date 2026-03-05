/**
 * Typography tokens.
 * Organized into fontFamily, fontWeight, fontSize, and lineHeight sub-objects.
 * All values remain as const for strict typing.
 */

export const typography = {
  fontFamily: {
    headings: "Montserrat",
    body: "Karla",
  },

  fontWeight: {
    regular: "400",
    semibold: "600",
    bold: "700",
  },

  fontSize: {
    h1: 32,
    h2: 24,
    h3: 20,
    subtitle1: 16,
    subtitle2: 14,
    body1: 16,
    body2: 14,
    caption: 12,
  },

  lineHeight: {
    h1: 40,
    h2: 32,
    h3: 24,
    subtitle1: 20,
    subtitle2: 16,
    body1: 20,
    body2: 16,
    caption: 16,
  },

  paragraphSpacing: {
    body1: 8,
    body2: 8,
    caption: 4,
  },
} as const;

export type TypographyFontFamilyKey = keyof typeof typography.fontFamily;
export type TypographyFontWeightKey = keyof typeof typography.fontWeight;
export type TypographyFontSizeKey = keyof typeof typography.fontSize;
export type TypographyLineHeightKey = keyof typeof typography.lineHeight;
export type TypographyParagraphSpacingKey = keyof typeof typography.paragraphSpacing;
