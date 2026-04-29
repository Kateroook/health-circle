import { utils } from '../../../utils/utils';
import AvatarPickerScreen from '../../screens/avatar-picker-screen';
import OnboardingScreen from '../../screens/onboarding-screen';
import PasswordSetupScreen from '../../screens/password-setup-screen';
import PushPermissionScreen from '../../screens/push-permission-screen';
import RegisterScreen from '../../screens/register-screen';

describe('Authorization', () => {
  it('[HC-74] Successful account creation', async () => {
    await OnboardingScreen.clickSkipOnboardingButton();
    await OnboardingScreen.clickregisterButton();
    const middleName = utils.random.middleName();
    const phone = '689106573';
    const userData = await RegisterScreen.register({ phone, middleName });

    const lastDbUser = await (global as any).backend.userRepository.waitForUserByEmail(userData.email);
    await expect(lastDbUser).toBeDefined();
    expect(lastDbUser).toMatchObject({
      email: userData.email.toLowerCase(),
      phone: '+380689106573',
      firstName: userData.firstName,
      lastName: userData.lastName,
      middleName: middleName,
    });

    const otpCodeRecord = await (global as any).backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const otpCode = otpCodeRecord.code;
    const password = utils.random.password();

    await PasswordSetupScreen.setupPassword(otpCode, password, password);
    await expect(PasswordSetupScreen.root).not.toBeDisplayed();

    await PushPermissionScreen.clickAllowLocationButton();
    await PushPermissionScreen.clickAllowPushButton();
    await AvatarPickerScreen.selectRandomAvatar();
    await AvatarPickerScreen.clickNextButton();
    await expect(PushPermissionScreen.root).not.toBeDisplayed();
  });
});
