import { saveFcmTokenToBackend } from "@/src/api/api";
import { useAuthStore } from "@/src/store/authStore";
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

    return unsubscribe;
  }, [user, accessToken]);
}
