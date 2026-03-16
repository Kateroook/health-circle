import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  setUserId as firebaseSetUserId,
  setUserProperties as firebaseSetUserProperties,
} from "@react-native-firebase/analytics";
import { useGlobalSearchParams, usePathname } from "expo-router";
import { useCallback, useEffect } from "react";

/**
 * Hook to automatically track screen views using expo-router.
 * It also provides methods for manual event tracking.
 */
export function useAnalytics() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  useEffect(() => {
    // Wait until pathname is available.
    if (!pathname) return;

    // Construct a viewable path, e.g., "/(auth)/login"
    // Params can be appended if needed, but pathname is usually enough for screen tracking.
    const logScreenView = async () => {
      try {
        const analytics = getAnalytics();
        await firebaseLogEvent(analytics, "screen_view", {
          firebase_screen: pathname,
          firebase_screen_class: pathname,
        });
      } catch (err) {
        console.warn("Failed to log screen view:", err);
      }
    };

    logScreenView();
  }, [pathname, params]);

  /**
   * Manually log a custom event.
   */
  const logEvent = useCallback(async (eventName: string, eventParams?: Record<string, any>) => {
    try {
      const analytics = getAnalytics();
      await firebaseLogEvent(analytics, eventName, eventParams);
    } catch (err) {
      console.warn(`Failed to log event ${eventName}:`, err);
    }
  }, []);

  /**
   * Set the user ID for analytics tracking.
   */
  const setUserId = useCallback(async (userId: string | null) => {
    try {
      const analytics = getAnalytics();
      await firebaseSetUserId(analytics, userId);
    } catch (err) {
      console.warn("Failed to set user ID:", err);
    }
  }, []);

  /**
   * Set user properties for better segmentation in the dashboard.
   */
  const setUserProperties = useCallback(async (properties: Record<string, string | null>) => {
    try {
      const analytics = getAnalytics();
      await firebaseSetUserProperties(analytics, properties);
    } catch (err) {
      console.warn("Failed to set user properties:", err);
    }
  }, []);

  return { logEvent, setUserId, setUserProperties };
}
