/**
 * Spacing scale tokens.
 * Numeric keys for layout, padding, margin.
 */

export const spacing = {
  2: 2,
  4: 4,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  20: 20,
  24: 24,
  28: 28,
  32: 32,
  40: 40,
  48: 48,
  56: 56,
  64: 64,
  72: 72,
  80: 80,
  88: 88,
  96: 96,
  104: 104,
  112: 112,
} as const;

export type SpacingKey = keyof typeof spacing;
export type SpacingValue = (typeof spacing)[SpacingKey];
