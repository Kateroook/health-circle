import { saveFcmTokenToBackend } from "@/src/api/api";
import { useAuthStore } from "@/src/store/authStore";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

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

  useEffect(() => {
    if (!user || !accessToken) return;

    const requestPermission = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const fcmToken = await messaging().getToken();
          if (fcmToken) {
            console.log("FCM Token:", fcmToken);
            await saveFcmTokenToBackend(fcmToken);
          }
        }

        // Ensure channel exists for Android
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default Channel",
          importance: Notifications.AndroidImportance.HIGH,
        });
      } catch (error) {
        console.error("FCM Permission denied:", error);
      }
    };

    requestPermission();

    const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
      console.log("FCM Token Refreshed:", newToken);
      await saveFcmTokenToBackend(newToken);
    });

    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      console.log("A new FCM message arrived!", JSON.stringify(remoteMessage));

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
      unsubscribe();
      unsubscribeOnMessage();
    };
  }, [user, accessToken]);
}
