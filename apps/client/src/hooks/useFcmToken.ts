import { saveFcmTokenToBackend } from "@/src/api/api";
import { useAuthStore } from "@/src/store/authStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import { logger } from "@/src/utils/logger";
import messaging from "@react-native-firebase/messaging";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect } from "react";

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

Notifications.setNotificationCategoryAsync("DANGER_STATUS", [
  {
    identifier: "OPEN_MAPS",
    buttonTitle: "Карта",
    options: { opensAppToForeground: true },
  },
  {
    identifier: "COPY_COORDS",
    buttonTitle: "Копіювати",
    options: { opensAppToForeground: false },
  },
]).catch((err) => logger.error("Failed to set categories", err));

export function useFcmToken() {
  const { user, accessToken } = useAuthStore();
  const {
    isPushEnabled,
    setPushEnabled,
    hasPromptedForNotifications,
    setHasPromptedForNotifications,
  } = useSettingsStore();

  const getAndSaveToken = useCallback(async () => {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        logger.info("FCM Token:", fcmToken);
        await saveFcmTokenToBackend(fcmToken);
      }
    } catch (error) {
      logger.error("Error getting FCM token:", error);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      setHasPromptedForNotifications(true);
      if (enabled) {
        setPushEnabled(true);
        await getAndSaveToken();

        // Ensure channel exists for Android
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default Channel",
          importance: Notifications.AndroidImportance.HIGH,
        });
        return true;
      } else {
        setPushEnabled(false);
        return false;
      }
    } catch (error) {
      logger.error("FCM Permission error:", error);
      return false;
    }
  }, [getAndSaveToken, setPushEnabled, setHasPromptedForNotifications]);

  useEffect(() => {
    if (!user || !accessToken) return;

    if (!hasPromptedForNotifications) {
      requestPermission();
      return;
    }

    if (!isPushEnabled) return;

    // Background check to verify if we still have permissions
    const checkPermission = async () => {
      const authStatus = await messaging().hasPermission();
      if (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        await getAndSaveToken();
      }
    };

    checkPermission();

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      logger.info("FCM Token Refreshed:", newToken);
      await saveFcmTokenToBackend(newToken);
    });

    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      logger.info("A new FCM message arrived!", JSON.stringify(remoteMessage));

      // Extract title and body from notification or data (fallback for data-only messages)
      const title = remoteMessage.notification?.title || remoteMessage.data?.title;
      const body = remoteMessage.notification?.body || remoteMessage.data?.body;

      if (title && body) {
        const isDanger = remoteMessage.data?.status === "DANGER";
        // Display a notification manually for foreground
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: remoteMessage.data || {},
            categoryIdentifier: isDanger ? "DANGER_STATUS" : undefined,
          },
          trigger: null, // show immediately
        });
      }
    });

    const unsubscribeResponse = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const actionId = response.actionIdentifier;
        const data = response.notification.request.content.data;

        if (data?.latitude && data?.longitude) {
          const url = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
          if (actionId === "OPEN_MAPS") {
            Linking.openURL(url).catch((err) => logger.error("Failed to open maps", err));
          } else if (actionId === "COPY_COORDS") {
            Clipboard.setStringAsync(`${data.latitude},${data.longitude}`).catch((err) =>
              logger.error("Failed to copy clipboard", err),
            );
          }
        } else {
          logger.error("No latitude or longitude in notification data: ", JSON.stringify(data));
        }
      },
    );

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeOnMessage();
      unsubscribeResponse.remove();
    };
  }, [
    user?.id,
    accessToken,
    isPushEnabled,
    hasPromptedForNotifications,
    requestPermission,
    getAndSaveToken,
  ]);

  return { requestPermission };
}
