/**
 * Design tokens – primitives and semantic.
 * Barrel export for convenient imports.
 */

// Primitives
export { borderWidth, colors, radius, spacing, typography } from "./primitives";

export type {
    BorderWidthKey,
    BorderWidthValue, ColorFamilyKey,
    ColorShadeKey, RadiusKey,
    RadiusValue, SpacingKey,
    SpacingValue, TypographyFontFamilyKey, TypographyFontSizeKey, TypographyFontWeightKey, TypographyLineHeightKey,
    TypographyParagraphSpacingKey
} from "./primitives";

// Semantic
export { semanticColors } from "./semantic/colors";

export type { SemanticColorContextKey, SemanticColorKey } from "./semantic/colors";

