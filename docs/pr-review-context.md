# Health Circle: Project Context & Review Guidelines

This document provides context for the AI PR Reviewer to understand the project structure, coding standards, and available components in the `apps/client` (React Native/Expo) application.

## 📁 Project Structure (apps/client)

- **`src/components/`**: Standardized UI components. ALWAYS reuse these.
- **`src/theme/`**: Design system tokens, colors, and global theme.
- **`src/hooks/`**: Custom React hooks for business logic and state.
- **`src/store/`**: Global state management (Zustand).
- **`src/api/`**: API clients and data fetching logic.
- **`src/app/`**: Expo Router navigation and screens.

## 🏗 Key Components

### UI Basics

- **`Avatar` / `MemberAvatar`**: Use for all profile and group images.
- **`Button`**: Supports `hierarchy` (primary, secondary, tertiary, accent), `size` (large, medium, small, xsmall), and `shape` (rectangle, pill, round).
- **`Typography`**: Use for all text. Supports `variant` (h1-h4, body1-2, caption, etc.) and `tone`.
- **`ListItem`**: Use for rows in settings, circle lists, etc.
- **`StatusBadge`**: Use for colorful status indicators.

### Layout & Modals

- **`ModalContainer`**: Main wrapper for center modals.
- **`BottomSheetContainer`**: Wrapper for bottom sheets.
- **`CircleItem`**: Specifically for displaying a circle in a list.

### Form Fields

- **`TextField`**: Standard input box.
- **`PinCodeField`**: For OTP or security pins.

## 🎨 Theme & Styling

### Colors

- All colors must come from `theme.colors` or the `COLORS` constant in `src/theme/colors.ts`.
- **Primary**: `theme.colors.primaryB`
- **Backgrounds**: `theme.colors.background.primary`, `tertiary`, etc.
- **States**: `theme.colors.state.safe`, `danger`, `warning`.

### Spacing & Layout

- Use `theme.spacing[N]` (e.g., 4, 8, 12, 16, 24, 32) for margins and paddings.
- Use `theme.radius[N]` (sm, md, lg, xl, pill, circle) for border radius.

### Rules

- **No Inline Styles**: Use `StyleSheet.create`.
- **No Hardcoded Values**: Always reference `theme`.

## 🚨 Best Practices & Common Mistakes

1. **Security**: Never commit `google-services.json` or `GoogleService-Info.plist`. These are ignored in `.gitignore` but should never be bypassed.
2. **AI Logic**: AI often moves functions around or deletes "unnecessary" comments. Double-check the delta.
3. **Expo APIs**: Use Expo-specific libraries (e.g., `expo-image`) over generic React Native ones for better compatibility.
4. **Hooks**: Ensure dependency arrays in `useMemo`, `useCallback`, and `useEffect` are correct.
