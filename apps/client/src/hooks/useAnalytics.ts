import analytics from "@react-native-firebase/analytics";
import { useGlobalSearchParams, usePathname } from "expo-router";
import { useEffect } from "react";

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
        await analytics().logScreenView({
          screen_name: pathname,
          screen_class: pathname,
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
  const logEvent = async (eventName: string, eventParams?: Record<string, any>) => {
    try {
      await analytics().logEvent(eventName, eventParams);
    } catch (err) {
      console.warn(`Failed to log event ${eventName}:`, err);
    }
  };

  /**
   * Set the user ID for analytics tracking.
   */
  const setUserId = async (userId: string | null) => {
    try {
      await analytics().setUserId(userId);
    } catch (err) {
      console.warn("Failed to set user ID:", err);
    }
  };

  /**
   * Set user properties for better segmentation in the dashboard.
   */
  const setUserProperties = async (properties: Record<string, string | null>) => {
    try {
      await analytics().setUserProperties(properties);
    } catch (err) {
      console.warn("Failed to set user properties:", err);
    }
  };

  return { logEvent, setUserId, setUserProperties };
}
