export type ToastType = "success" | "error" | "info" | "warning";

export type ShowToastOptions = {
  type: ToastType;
  title: string;
  subtitle?: string;
  duration?: number;
  compact?: boolean;
};
