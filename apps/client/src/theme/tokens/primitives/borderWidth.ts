/**
 * Border width tokens.
 * Semantic naming (none,xs, sm, md, lg, xl) for stroke/border widths.
 * Values are in points (logical pixels).
 */

export const borderWidth = {
  none: 0,
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 8,
} as const;

export type BorderWidthKey = keyof typeof borderWidth;
export type BorderWidthValue = (typeof borderWidth)[BorderWidthKey];
