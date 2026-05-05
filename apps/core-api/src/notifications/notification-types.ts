export enum NotificationType {
  STATUS_UPDATE = 'STATUS_UPDATE',
  ROLL_CALL = 'ROLL_CALL',
  PERSONAL_ROLL_CALL = 'PERSONAL_ROLL_CALL',
  UNKNOWN_STATUS = 'UNKNOWN_STATUS',
  AIR_ALERT = 'AIR_ALERT',
  MOOD_REMINDER = 'MOOD_REMINDER',
}

export interface NotificationPayloadData {
  [key: string]: string | undefined;
}

export interface NotificationTemplate {
  title: string;
  body: string | ((data: any) => string);
  permissionKey: string;
  fcmType: string;
}

export const NotificationTemplates: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.STATUS_UPDATE]: {
    title: 'Оновлення статусу',
    body: (data) => {
      let text = `Статус ${data.firstName} ${data.lastName} змінено на "${data.statusName}".`;
      if (data.status === 'DANGER' && data.latitude && data.longitude) {
        text += `\nРозташування: https://maps.google.com/?q=${data.latitude},${data.longitude}`;
      }
      return text;
    },
    permissionKey: 'statusUpdates',
    fcmType: 'USER_STATUS_UPDATE',
  },
  [NotificationType.ROLL_CALL]: {
    title: 'Перекличка!',
    body: (data) => `Учасник кола "${data.groupName}" просить підтвердити ваш статус безпеки`,
    permissionKey: 'statusUpdateReminders',
    fcmType: 'ROLL_CALL',
  },
  [NotificationType.PERSONAL_ROLL_CALL]: {
    title: 'Особиста перекличка!',
    body: (data) => `${data.requesterName} просить підтвердити ваш статус безпеки`,
    permissionKey: 'statusUpdateReminders',
    fcmType: 'PERSONAL_ROLL_CALL',
  },
  [NotificationType.UNKNOWN_STATUS]: {
    title: '❓ Статус невідомий',
    body: (data) => `${data.firstName} ${data.lastName} не оновив статус вчасно`,
    permissionKey: 'unknownStatusAlerts',
    fcmType: 'USER_STATUS_UPDATE',
  },
  [NotificationType.AIR_ALERT]: {
    title: 'Повітряна тривога!',
    body: (data) => `${data.alertType}: у вашому регіоні (${data.regionName}) оголошено тривогу!`,
    permissionKey: 'airAlerts',
    fcmType: 'AIR_ALERT',
  },
  [NotificationType.MOOD_REMINDER]: {
    title: 'Як ви почуваєтесь? 😊',
    body: 'Не забудьте відмітити свій настрій у додатку',
    permissionKey: 'moodReminders',
    fcmType: 'MOOD_REMINDER',
  },
};
