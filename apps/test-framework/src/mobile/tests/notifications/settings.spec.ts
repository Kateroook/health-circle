import appHelper from 'src/mobile/helpers/app-helper';
import dashboardScreen from 'src/mobile/screens/dashboard-screen';
import loginScreen from 'src/mobile/screens/login-screen';
import settingsNotificationsScreen from 'src/mobile/screens/settings-notifications-screen';
import settingsScreen from 'src/mobile/screens/settings-screen';

describe('Settings Notifications', () => {
  it('[HC-185] Verify notification toggle states are saved after app restart', async () => {
    const user = await browser.backend.spawnUser();
    await loginScreen.openDirectly();
    await loginScreen.login({
      identifier: user.email,
      password: user.password,
    });

    await dashboardScreen.waitForIsShown();
    await settingsScreen.openDirectly();
    await settingsScreen.goToNotifications();
    await settingsNotificationsScreen.waitForIsShown();

    let [smsFalloverSwitch, smsSafetyStatusSwitch] = [
      await settingsNotificationsScreen.switches.getByLabel(
        'Отримувати SMS лише тоді, коли немає інтернету, але є важливе сповіщення.',
      ),
      await settingsNotificationsScreen.switches.getByLabel('SMS для статусу безпеки'),
    ];

    const statusBefore = [await smsFalloverSwitch.getValue(), await smsSafetyStatusSwitch.getValue()];
    await smsFalloverSwitch.toggle();
    await smsSafetyStatusSwitch.toggle();
    await settingsNotificationsScreen.goBack();

    await appHelper.restartApp();

    await dashboardScreen.waitForIsShown();
    await settingsScreen.openDirectly();
    await settingsScreen.goToNotifications();

    [smsFalloverSwitch, smsSafetyStatusSwitch] = [
      await settingsNotificationsScreen.switches.getByLabel(
        'Отримувати SMS лише тоді, коли немає інтернету, але є важливе сповіщення.',
      ),
      await settingsNotificationsScreen.switches.getByLabel('SMS для статусу безпеки'),
    ];

    const statusAfter = [await smsFalloverSwitch.getValue(), await smsSafetyStatusSwitch.getValue()];

    statusBefore.forEach((el, index) => expect(el).toEqual(!statusAfter[index]));
  });
});
