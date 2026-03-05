/**
 * Effect styles – shadows, glows, and other visual effects.
 *
 * Note: React Native's shadow system is platform-specific.
 * These are provided as reference shadow definitions that can be converted
 * to platform-specific shadow styles via helper functions or libraries.
 */

export const effects = {
  /**
   * Shallow drop shadow – subtle elevation, commonly used on cards
   * CSS: box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.12)
   */
  shallowBelow: {
    /** React Native shadow properties (iOS) */
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    /** Android elevation as alternative */
    elevation: 8,
  },
} as const;

export type EffectKey = keyof typeof effects;

/**
 * Helper type for shadow styles in React Native.
 * Use with ViewStyle or other style types.
 */
export type ShadowStyle = {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
};
