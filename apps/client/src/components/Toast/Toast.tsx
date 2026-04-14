import { Typography } from "@/src/components/typography";
import { theme } from "@/src/theme/theme";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, type ComponentProps } from "react";
import { Animated, Easing, PanResponder, Pressable, StyleSheet, View } from "react-native";
import type { QueuedToast } from "./types";

const ENTER_MS = 320;
const EXIT_MS = 240;
const SWIPE_DISMISS_DY = -48;

// Apple Health color palette — soft, desaturated
const ACCENT: Record<QueuedToast["type"], string> = {
  success: theme.colors.positive,
  error: theme.colors.negative,
  info: theme.colors.accent,
  warning: theme.colors.warning,
};

const ACCENT_BG: Record<QueuedToast["type"], string> = {
  success: "rgba(52, 199, 89, 0.12)",
  error: "rgba(255, 59, 48, 0.12)",
  info: "rgba(0, 122, 255, 0.12)",
  warning: "rgba(255, 149, 0, 0.12)",
};

const ICON_NAME = {
  success: "check",
  error: "alert-circle",
  info: "info",
  warning: "alert-triangle",
} as const satisfies Record<QueuedToast["type"], string>;

function resolveAutoDismissMs(item: QueuedToast): number | null {
  if (item.type === "error") return null;
  if (item.compact) return item.duration ?? 2000;
  return item.duration ?? 3500;
}

type ToastProps = {
  item: QueuedToast;
  onRemoved: () => void;
};

export function Toast({ item, onRemoved }: ToastProps) {
  const translateY = useRef(new Animated.Value(-24)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const exitingRef = useRef(false);
  const removedRef = useRef(false);

  const runExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -16,
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.96,
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !removedRef.current) {
        removedRef.current = true;
        onRemoved();
      }
    });
  }, [onRemoved, opacity, translateY, scale]);

  useEffect(() => {
    translateY.setValue(-24);
    opacity.setValue(0);
    scale.setValue(0.94);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: ENTER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [item.id]);

  useEffect(() => {
    const ms = resolveAutoDismissMs(item);
    if (ms == null) return;
    const t = setTimeout(() => runExit(), ms);
    return () => clearTimeout(t);
  }, [item.id, item.type, item.compact, item.duration, runExit]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > Math.abs(g.dx) && Math.abs(g.dy) > 10,
        onPanResponderRelease: (_, g) => {
          if (g.dy < -36 || g.vy < -0.45) runExit();
        },
      }),
    [runExit],
  );

  const accent = ACCENT[item.type];
  const accentBg = ACCENT_BG[item.type];
  const iconName = ICON_NAME[item.type];

  // ── Compact pill ──────────────────────────────────
  if (item.compact) {
    return (
      <Animated.View
        style={[styles.compactOuter, { opacity, transform: [{ translateY }, { scale }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={runExit}
          style={({ pressed }) => [styles.compactInner, pressed && styles.pressed]}
        >
          {/* Small icon circle */}
          <View style={[styles.compactIconCircle, { backgroundColor: accentBg }]}>
            <Feather
              name={iconName as ComponentProps<typeof Feather>["name"]}
              size={12}
              color={accent}
            />
          </View>
          <Typography variant="body2" weight="semibold" tone="primary" style={styles.compactText}>
            {item.title}
          </Typography>
        </Pressable>
      </Animated.View>
    );
  }

  // ── Card ─────────────────────────────────────────
  return (
    <Animated.View
      style={[styles.cardOuter, { opacity, transform: [{ translateY }, { scale }] }]}
      {...panResponder.panHandlers}
    >
      <Pressable
        onPress={item.type === "error" ? runExit : undefined}
        style={({ pressed }) => [styles.cardInner, pressed && styles.pressed]}
      >
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: accentBg }]}>
          <Feather
            name={iconName as ComponentProps<typeof Feather>["name"]}
            size={16}
            color={accent}
          />
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Typography variant="subtitle1" tone="primary" weight="semibold">
            {item.title}
          </Typography>
          {item.subtitle ? (
            <Typography variant="caption" tone="secondary" style={styles.subtitle}>
              {item.subtitle}
            </Typography>
          ) : null}
        </View>

        {/* Close — only for errors or long toasts */}
        {(item.type === "error" || item.subtitle) && (
          <Pressable
            onPress={runExit}
            hitSlop={8}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Feather name="x" size={16} color={theme.colors.content.tertiary} />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },

  // ── Compact pill ──
  compactOuter: {
    alignSelf: "center",
    borderRadius: 999,
    // Glass feel
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  compactInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[8],
    gap: theme.spacing[8],
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
    // inherits primary tone — dark on light bg
  },

  // ── Card ──
  cardOuter: {
    borderRadius: theme.radius.xl,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing[14],
    paddingHorizontal: theme.spacing[16],
    gap: theme.spacing[12],
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
