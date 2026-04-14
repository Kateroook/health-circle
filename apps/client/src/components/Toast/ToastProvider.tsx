import { theme } from "@/src/theme/theme";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toast } from "./Toast";
import type { QueuedToast, ShowToastOptions } from "./types";

type ToastContextValue = {
  showToast: (options: ShowToastOptions) => void;
  toasts: QueuedToast[];
  remove: (id: string) => void;
  pushModalLayer: () => void; // called when a modal opens
  popModalLayer: () => void; // called when a modal closes
  modalDepth: number; // how many modals are open
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  // Only expose showToast publicly
  return { showToast: ctx.showToast };
}

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<QueuedToast[]>([]);
  const [modalDepth, setModalDepth] = useState(0);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((options: ShowToastOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setToasts((prev) => [{ ...options, id }, ...prev].slice(0, MAX_VISIBLE));
  }, []);

  const pushModalLayer = useCallback(() => {
    setModalDepth((d) => d + 1);
  }, []);

  const popModalLayer = useCallback(() => {
    setModalDepth((d) => Math.max(0, d - 1));
  }, []);

  const value = useMemo(
    () => ({ showToast, toasts, remove, pushModalLayer, popModalLayer, modalDepth }),
    [showToast, toasts, remove, pushModalLayer, popModalLayer, modalDepth],
  );
  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFill, styles.layer]}
        collapsable={false}
      >
        <View
          pointerEvents="box-none"
          style={[
            styles.stack,
            {
              top: insets.top + theme.spacing[8],
              left: theme.spacing[16],
              right: theme.spacing[16],
            },
          ]}
        >
          {toasts.map((t) => (
            <Toast key={t.id} item={t} onRemoved={() => remove(t.id)} />
          ))}
        </View>
      </View>
      {modalDepth === 0 && <ToastStack insets={insets} />}
    </ToastContext.Provider>
  );
}

export function ToastStack({ insets }: { insets: { top: number } }) {
  const ctx = useContext(ToastContext);
  if (!ctx || ctx.toasts.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View
        style={[
          styles.stack,
          {
            top: insets.top + theme.spacing[8],
            left: theme.spacing[16],
            right: theme.spacing[16],
          },
        ]}
        pointerEvents="box-none"
      >
        {ctx.toasts.map((t) => (
          <Toast key={t.id} item={t} onRemoved={() => ctx.remove(t.id)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 99999,
    elevation: 9999,
  },
  stack: {
    position: "absolute",
    gap: theme.spacing[8],
    alignItems: "stretch",
  },
});
