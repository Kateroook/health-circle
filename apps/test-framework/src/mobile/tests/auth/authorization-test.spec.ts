import { UserFactory } from '@core/data/factories/user-factory';
import DashboardScreen from 'src/mobile/screens/dashboard-screen';
import LocationPermissionScreen from 'src/mobile/screens/location-permission-screen';
import AvatarPickerScreen from '../../screens/avatar-picker-screen';
import PasswordSetupScreen from '../../screens/password-setup-screen';
import PushPermissionScreen from '../../screens/push-permission-screen';
import RegisterScreen from '../../screens/register-screen';

describe('Authorization', () => {
  it('[HC-74] Successful account creation', async () => {
    let user = UserFactory.createRandomUser();
    console.log(user);
    await RegisterScreen.openDirectly();
    await RegisterScreen.register({
      countryCode: user.countryCode,
      phoneWithoutCode: user.phoneWithoutCode,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    await PasswordSetupScreen.waitForIsShown();

    const userDbRow = (
      await browser.backend.userRepository.findBy({
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
      })
    )[0];
    console.log(userDbRow);
    user.id = userDbRow.id;
    browser.backend.dbCleaner.add('users', user.id);

    const confirmationCode = (await browser.backend.confirmationCodeRepository.getLastUserCode(user.id)).code;

    await PasswordSetupScreen.setupPassword(confirmationCode, user.password, user.password);

    await LocationPermissionScreen.clickSkipLocationButton();
    await PushPermissionScreen.clickSkipPushButton();
    await AvatarPickerScreen.clickSkipAvatarButton();

    await DashboardScreen.waitForIsShown();

    await expect(DashboardScreen.mainStatusButtonText).toHaveText('Невідомо');
  });
});
