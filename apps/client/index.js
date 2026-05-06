import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import "expo-router/entry";

const messaging = getMessaging();

setBackgroundMessageHandler(messaging, async (remoteMessage) => {
  console.log("Message handled in the background!", remoteMessage);

  // Extract title and body from notification or data (fallback for data-only messages)
  const title = remoteMessage.notification?.title || remoteMessage.data?.title;
  const body = remoteMessage.notification?.body || remoteMessage.data?.body;

  if (title && body) {
    const isDanger = remoteMessage.data?.status === "DANGER";
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: remoteMessage.data || {},
        categoryIdentifier: isDanger ? "DANGER_STATUS" : undefined,
      },
      trigger: null,
    });
  }
});
