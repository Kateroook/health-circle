import { saveFcmTokenToBackend } from "@/src/api/api";
import { useAuthStore } from "@/src/store/authStore";
import notifee, { AndroidImportance } from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import { useEffect } from "react";

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
        // Create a channel (required for Android)
        const channelId = await notifee.createChannel({
          id: "default",
          name: "Default Channel",
          importance: AndroidImportance.HIGH,
        });

        // Display a notification
        await notifee.displayNotification({
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: "default",
            },
          },
        });
      }
    });

    return () => {
      unsubscribe();
      unsubscribeOnMessage();
    };
  }, [user, accessToken]);
}
