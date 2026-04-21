import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { Feather } from "@expo/vector-icons";
import React, { createContext, useCallback, useContext, useMemo, type ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast, { type ToastConfig } from "react-native-toast-message";
import { Portal } from "../modal/PortalProvider";
import type { ShowToastOptions, ToastType } from "./types";

type ToastContextValue = {
  showToast: (options: ShowToastOptions) => void;
};

const ICON_NAME = {
  success: "check",
  error: "alert-circle",
  info: "info",
  warning: "alert-triangle",
} as const satisfies Record<ToastType, string>;

const ACCENT: Record<ToastType, string> = {
  success: theme.colors.positive,
  error: theme.colors.negative,
  info: theme.colors.accent,
  warning: theme.colors.warning,
};

const ACCENT_BG: Record<ToastType, string> = {
  success: "rgba(52, 199, 89, 0.12)",
  error: "rgba(255, 59, 48, 0.12)",
  info: "rgba(0, 122, 255, 0.12)",
  warning: "rgba(255, 149, 0, 0.12)",
};

export const ToastContext = createContext<ToastContextValue | null>(null);

function ToastCard({
  type,
  text1,
  text2,
  hide,
  isCompact,
}: {
  type: ToastType;
  text1?: string;
  text2?: string;
  hide: () => void;
  isCompact: boolean;
}) {
  const accent = ACCENT[type];
  const accentBg = ACCENT_BG[type];
  const iconName = ICON_NAME[type];

  if (isCompact) {
    return (
      <Pressable
        onPress={hide}
        style={({ pressed }) => [styles.compactInner, pressed && styles.pressed]}
      >
        <View style={[styles.compactIconCircle, { backgroundColor: accentBg }]}>
          <Feather
            name={iconName as ComponentProps<typeof Feather>["name"]}
            size={12}
            color={accent}
          />
        </View>
        <Typography variant="body2" weight="semibold" tone="primary" style={styles.compactText}>
          {text1}
        </Typography>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={type === "error" ? hide : undefined}
      style={({ pressed }) => [styles.cardInner, pressed && styles.pressed]}
    >
      <View style={[styles.iconCircle, { backgroundColor: accentBg }]}>
        <Feather
          name={iconName as ComponentProps<typeof Feather>["name"]}
          size={16}
          color={accent}
        />
      </View>
      <View style={styles.textBlock}>
        <Typography variant="subtitle1" tone="primary">
          {text1}
        </Typography>
        {text2 ? (
          <Typography variant="caption" tone="secondary" style={styles.subtitle}>
            {text2}
          </Typography>
        ) : null}
      </View>
      {(type === "error" || text2) && (
        <Pressable
          onPress={hide}
          hitSlop={8}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Feather name="x" size={16} color={theme.colors.content.tertiary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const toastConfig: ToastConfig = {
  success: ({ text1, text2, hide, props }) => (
    <ToastCard
      type="success"
      text1={text1}
      text2={text2}
      hide={hide}
      isCompact={Boolean(props?.compact)}
    />
  ),
  error: ({ text1, text2, hide, props }) => (
    <ToastCard
      type="error"
      text1={text1}
      text2={text2}
      hide={hide}
      isCompact={Boolean(props?.compact)}
    />
  ),
  info: ({ text1, text2, hide, props }) => (
    <ToastCard
      type="info"
      text1={text1}
      text2={text2}
      hide={hide}
      isCompact={Boolean(props?.compact)}
    />
  ),
  warning: ({ text1, text2, hide, props }) => (
    <ToastCard
      type="warning"
      text1={text1}
      text2={text2}
      hide={hide}
      isCompact={Boolean(props?.compact)}
    />
  ),
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return { showToast: ctx.showToast };
}

function resolveAutoHideMs(options: ShowToastOptions): number {
  if (options.type === "error") return options.duration ?? 5000;
  if (options.compact) return options.duration ?? 2000;
  return options.duration ?? 3500;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (options: ShowToastOptions) => {
      Toast.show({
        type: options.type,
        text1: options.title,
        text2: options.subtitle,
        autoHide: true,
        visibilityTime: resolveAutoHideMs(options),
        topOffset: insets.top + theme.spacing[8],
        props: { compact: options.compact },
      });
    },
    [insets.top],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <GlobalToast />
    </ToastContext.Provider>
  );
}

export function GlobalToast() {
  const insets = useSafeAreaInsets();
  return (
    <Portal id="global-toast" group="toasts">
      <View pointerEvents="box-none" style={styles.hostLayer}>
        <Toast config={toastConfig} topOffset={insets.top + theme.spacing[8]} />
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  hostLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100000,
    elevation: 10000,
  },
  compactInner: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[8],
    gap: theme.spacing[8],
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 30,
  },
  compactIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  compactText: {
    marginBottom: 0,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing[16],
    paddingVertical: theme.spacing[14],
    paddingHorizontal: theme.spacing[16],
    gap: theme.spacing[12],
    borderRadius: theme.radius.xl,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 30,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: theme.spacing[2],
  },
  subtitle: {
    marginTop: 1,
  },
  closeButton: {
    padding: theme.spacing[4],
    flexShrink: 0,
  },
});
