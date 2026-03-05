import { colors } from "../primitives/colors";

export const semanticColors = {
  /**
   * Core UI colors: primary text, accent, state indicators, etc.
   */
  primaryB: colors.grey[900], // "#1c1c1e" – Primary background / dark text
  primaryA: colors.white, // "#ffffff" – Primary foreground / light background
  accent: colors.blue[500], // "#5a8dee" – Interactive, links, CTA
  negative: colors.red[500], // "#f83446" – Error, destructive
  positive: colors.green[400], // "#06c167" – Success, approval
  warning: colors.amber[300], // "#ffb749" – Caution, alert

  /**
   * Background colors
   * Used for surfaces, cards, overlays, state-specific backgrounds
   */
  background: {
    primary: colors.grey[100], // "#f5f7fa" – Primary app background
    tertiary: colors.grey[200], // "#e8ecf2" – Secondary-level backgrounds
    positive: colors.green[400], // "#06c167" – Success/positive sections
    negative: colors.red[500], // "#f83446" – Error/negative sections
    warning: colors.amber[300], // "#ffb749" – Warning sections
    overlay: "rgba(0, 0, 0, 0.25)", // Modals, dimmed backdrop
    lightPositive: colors.green[50], // "#eaf6ed" – Soft success background
    lightNegative: colors.red[50], // "#fff0ee" – Soft error background
    lightWarning: colors.amber[50], // "#fff1e1" – Soft warning background
  },

  /**
   * Content / text colors
   * Text, icons, and content element colors
   */
  content: {
    primary: colors.grey[900], // "#1c1c1e" – Main text
    secondary: colors.grey[600], // "#5d6470" – Labels, muted text
    tertiary: colors.grey[500], // "#8a9099" – Disabled, hints
    onColor: colors.white, // "#ffffff" – Text on colored backgrounds
    onColorInverse: colors.black, // "#000000" – Inverse text (rare)
  },

  /**
   * Border colors
   * Strokes, dividers, focus states
   */
  border: {
    selected: colors.grey[900], // "#1c1c1e" – Focus, selected borders
    opaque: colors.grey[200], // "#e8ecf2" – Default dividers
    positive: colors.green[400], // "#06c167" – Success border
    negative: colors.red[500], // "#f83446" – Error border
    warning: colors.amber[600], // "#a95f03" – Warning border
    transparent: "rgba(28, 28, 30, 0.08)", // Subtle, low-contrast borders
  },

  /**
   * State colors
   * User status indicators during air raid alerts
   */
  state: {
    safe: colors.green[400], // "#06c167" – Safe/OK/healthy
    emergency: colors.red[500], // "#f83446" – Emergency/critical
    unknown: colors.amber[300], // "#ffb749" – Unknown/uncertain
    beenSafe: colors.blue[600], // "#068bee" – Previously safe
    calm: colors.grey[300], // "#d0d5dd" – Calm/inactive
  },

  /**
   * State background colors
   * For badges, pills, light status backgrounds
   */
  stateBackground: {
    safe: colors.green[50], // "#eaf6ed" – Light safe background
    emergency: colors.red[50], // "#fff0ee" – Light emergency background
    unknown: colors.amber[50], // "#fff1e1" – Light unknown background
    beenSafe: colors.blue[50], // "#f4f9ff" – Light been-safe background
    calm: colors.grey[50], // "#fafbfd" – Light calm background
  },
} as const;

export type SemanticColorKey =
  | "primaryB"
  | "primaryA"
  | "accent"
  | "negative"
  | "positive"
  | "warning"
  | keyof typeof semanticColors.background
  | keyof typeof semanticColors.content
  | keyof typeof semanticColors.border
  | keyof typeof semanticColors.state
  | keyof typeof semanticColors.stateBackground;

export type SemanticColorContextKey = "background" | "content" | "border" | "state" | "stateLight";
