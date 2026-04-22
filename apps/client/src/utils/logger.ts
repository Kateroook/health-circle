const API_LOGS_ENABLED = __DEV__ && process.env.EXPO_PUBLIC_API_LOGS_ENABLED !== "false";

/**
 * Simple logger utility that only logs in development mode.
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (__DEV__) {
      console.log(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (__DEV__) {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (__DEV__) {
      console.error(message, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (__DEV__) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  api: (message: string, ...args: any[]) => {
    if (API_LOGS_ENABLED) {
      console.log(message, ...args);
    }
  },
};
