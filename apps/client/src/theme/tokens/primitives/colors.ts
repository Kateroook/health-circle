/**
 * Primitive color tokens.
 * These are base, un-aliased colors organized by color family.
 * Used as the foundation for semantic color mappings.
 */

export const colors = {
  purple: {
    900: "#3a1659",
    800: "#633495",
    700: "#7c3ec3",
    600: "#944de7",
    500: "#a964f7",
    400: "#c490f9",
    300: "#ebd5ff",
    200: "#ebd5ff",
    100: "#f2e3ff",
    50: "#f9f1ff",
  },

  blue: {
    900: "#0b2a52",
    800: "#0f3a73",
    700: "#15529e",
    600: "#068bee",
    500: "#5a8dee",
    400: "#7aa6f2",
    300: "#a1c1f7",
    200: "#c7dbfb",
    100: "#e7f1fe",
    50: "#f4f9ff",
  },

  teal: {
    900: "#002d33",
    800: "#1a535a",
    700: "#016974",
    600: "#007f8c",
    500: "#0095a4",
    400: "#01b8ca",
    300: "#77d5e3",
    200: "#b0e7ef",
    100: "#cdeef3",
    50: "#e2f8fb",
  },

  green: {
    900: "#002f14",
    800: "#0d572d",
    700: "#166c3b",
    600: "#0e8345",
    500: "#009a51",
    400: "#06c167",
    300: "#7fd99a",
    200: "#b1eac2",
    100: "#d3efda",
    50: "#eaf6ed",
  },

  red: {
    900: "#520810",
    800: "#950f22",
    700: "#bb032a",
    600: "#de1135",
    500: "#f83446",
    400: "#fc7f79",
    300: "#ffb2ab",
    200: "#ffd2cd",
    100: "#ffe1de",
    50: "#fff0ee",
  },

  amber: {
    900: "#3e2000",
    800: "#763a00",
    700: "#904a07",
    600: "#a95f03",
    500: "#c46e00",
    400: "#df9500",
    300: "#ffb749",
    200: "#ffd5a1",
    100: "#ffe4b7",
    50: "#fff1e1",
  },

  grey: {
    900: "#1c1c1e",
    800: "#2a2a2e",
    700: "#3c3f46",
    600: "#5d6470",
    500: "#8a9099",
    400: "#b3b9c3",
    300: "#d0d5dd",
    200: "#e8ecf2",
    100: "#f5f7fa",
    50: "#fafbfd",
  },

  white: "#ffffff",
  black: "#000000",
} as const;

export type ColorFamilyKey = keyof typeof colors;
export type ColorShadeKey =
  | keyof (typeof colors)["grey"]
  | keyof (typeof colors)["purple"]
  | keyof (typeof colors)["blue"];
