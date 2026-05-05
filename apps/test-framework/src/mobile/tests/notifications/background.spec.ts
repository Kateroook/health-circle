import { ApiClientFactory } from '@core/api/api-client-factory';
import { GroupFactory } from '@core/data/factories/group-factory';
import { GroupEntity } from '@core/types/entites/group-interface';
import { UserEntity } from '@core/types/entites/user-interface';
import { NotificationHelper } from 'src/mobile/helpers/notification-helper';
import dashboardScreen from 'src/mobile/screens/dashboard-screen';
import loginScreen from 'src/mobile/screens/login-screen';
import { utils } from 'src/utils/utils';
import { NotificationType } from '../../../../../core-api/src/notifications/notification-types';

describe('Background Notifications', () => {
  let user1: UserEntity;
  let user2: UserEntity;
  let api1: ApiClientFactory;
  let api2: ApiClientFactory;
  let group: GroupEntity;

  beforeEach(async () => {
    user1 = await browser.backend.spawnUser();
    user2 = await browser.backend.spawnUser();
    group = GroupFactory.createGroupWithSpecificOwner(user1);
    group.name = `BG notification test: ${utils.random.shortId()}`;
    api1 = browser.backend.api;
    api2 = await browser.backend.spawnApi();

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
    await NotificationHelper.closeApp();
  });

  it('[HC-95] Verify push notification is received when a circle member changes status to "Потрібна допомога"', async () => {
    await api1.users.updateUserStatus({ status: 'DANGER' });

    await NotificationHelper.open();
    const notification = await NotificationHelper.openAndTap(NotificationType.STATUS_UPDATE, {
      firstName: user1.firstName,
      lastName: user1.lastName,
    });

    await dashboardScreen.waitForIsShown();

    expect(notification).toBeDefined();
    expect(notification?.actualTitle).toBe('Оновлення статусу');
    expect(notification?.actualBody).toContain(user1.firstName);
    expect(notification?.actualBody).toContain(user1.lastName);
    expect(notification?.actualBody).toContain('треба допомога');
  });

  it('[HC-96] Verify push notification is received when a requested member updates their status', async () => {
    await api2.users.initiatePersonalRollCall(user1.id!);

    await api1.users.updateUserStatus({ status: 'SAFE' });

    await NotificationHelper.open();
    const notification = await NotificationHelper.openAndTap(NotificationType.STATUS_UPDATE, {
      firstName: user1.firstName,
      lastName: user1.lastName,
    });

    await dashboardScreen.waitForIsShown();

    expect(notification).toBeDefined();
    expect(notification?.actualTitle).toBe('Оновлення статусу');
    expect(notification?.actualBody).toContain(user1.firstName);
    expect(notification?.actualBody).toContain(user1.lastName);
    expect(notification?.actualBody).toContain('у безпеці');
  });

  afterEach(async () => {
    await NotificationHelper.clearAll();
    await NotificationHelper.close();
  });
});
