/**
 * Border radius tokens.
 * Semantic naming (none, sm, md, lg, xl) plus special shapes (pill, circle).
 */

export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  pill: 999,
  circle: 999,
} as const;

export type RadiusKey = keyof typeof radius;
export type RadiusValue = (typeof radius)[RadiusKey];
