import { GroupFactory } from '@core/data/factories/group-factory';
import NotificationHelper from 'src/mobile/helpers/notification-helper';
import dashboardScreen from 'src/mobile/screens/dashboard-screen';
import loginScreen from 'src/mobile/screens/login-screen';
import { utils } from 'src/utils/utils';
import { NotificationType } from '../../../../../core-api/src/notifications/notification-types';

describe('Foreground Notifications', () => {
  it('[HC-95] Verify push notification is received when a circle member changes status to "Потрібна допомога"', async () => {
    //Create users, group and corresponding API clients
    const user1 = await browser.backend.spawnUser();
    const user2 = await browser.backend.spawnUser();
    let group = GroupFactory.createGroupWithSpecificOwner(user1);
    group.name = `HC-95 (foreground); ${utils.random.shortId()}`;
    const api1 = browser.backend.api;
    const api2 = await browser.backend.spawnApi();

    await api1.auth.login({
      identifier: user1.email,
      password: user1.password,
    });
    await api2.auth.login({
      identifier: user2.email,
      password: user2.password,
    });

    const groupResult = await api1.groups.createGroup({
      name: group.name,
    });
    group.id = groupResult.data.id;
    group.inviteCode = groupResult.data.inviteCode;

    await api2.groups.joinGroup({ code: group.inviteCode! });

    await loginScreen.openDirectly();
    await loginScreen.login({
      identifier: user2.email,
      password: user2.password,
    });
    await dashboardScreen.waitForIsShown();

    await api1.users.updateUserStatus({ status: 'DANGER' });

    await NotificationHelper.open();
    const notification = await NotificationHelper.waitForNotification(NotificationType.STATUS_UPDATE, {
      firstName: user1.firstName,
      lastName: user1.lastName,
    });

    console.log(notification);

    expect(notification).toBeDefined();
    expect(notification?.actualTitle).toBe('Оновлення статусу');
    expect(notification?.actualBody).toContain(user1.firstName);
    expect(notification?.actualBody).toContain(user1.lastName);
    expect(notification?.actualBody).toContain('треба допомога');
  });

  afterEach(async () => {
    await NotificationHelper.clearAll();
    await NotificationHelper.close();
  });
});
