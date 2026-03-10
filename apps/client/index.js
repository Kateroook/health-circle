import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import "expo-router/entry";

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
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
