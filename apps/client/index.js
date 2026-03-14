import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import "expo-router/entry";

const messaging = getMessaging();

setBackgroundMessageHandler(messaging, async (remoteMessage) => {
  console.log("Message handled in the background!", remoteMessage);

  if (remoteMessage.notification) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
      },
      trigger: null,
    });
  }
});
