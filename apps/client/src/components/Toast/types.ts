export type ToastType = "success" | "error" | "info" | "warning";

export type ShowToastOptions = {
  type: ToastType;
  title: string;
  subtitle?: string;
  /** Auto-dismiss duration in ms. Ignored for `error` (manual dismiss only). */
  duration?: number;
  compact?: boolean;
};

export type QueuedToast = ShowToastOptions & { id: string };
