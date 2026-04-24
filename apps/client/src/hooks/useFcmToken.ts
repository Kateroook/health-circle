import { saveFcmTokenToBackend } from "@/src/api/api";
import { logger } from "@/src/utils/logger";
import { useAuthStore } from "@/src/store/authStore";
import { useSettingsStore } from "@/src/store/settingsStore";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { useEffect, useCallback } from "react";

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

      if (remoteMessage.notification) {
        // Display a notification manually for foreground
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
          },
          trigger: null, // show immediately
        });
      }
    });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeOnMessage();
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
