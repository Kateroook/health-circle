import { utils } from '../../utils/utils';
import DashboardScreen from '../screens/dashboard-screen';
import LoginScreen from '../screens/login-screen';
import PasswordSetupScreen from '../screens/password-setup-screen';
import RegisterScreen from '../screens/register-screen';
import ResetPasswordScreen from '../screens/reset-password-screen';

describe('Login', () => {
  let user: any;
  before(async () => {
    user = await (global as any).backend.spawnUser();
    await driver.terminateApp('com.healthcircle.app');
    await driver.activateApp('com.healthcircle.app');
  });
  it('[HC-54] Login with password reset', async () => {
    await ResetPasswordScreen.setupPassword(user.email, user.newOtpCode, user.newPassword, user.newPassword);
    await LoginScreen.login(user.email, user.newPassword);
    await expect(DashboardScreen.root).toBeDisplayed();
  });

  it('[HC-60] Login with old password after password reset without updating', async () => {
    const userData = await RegisterScreen.register();

    const lastDbUser = await browser.backend.userRepository.getLast('createdAt');

    const otpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const otpCode = otpCodeRecord.code;
    const password = utils.random.password();

    await PasswordSetupScreen.setupPassword(otpCode, password, password);
    await LoginScreen.clickResetPasswordLink();
    const newOtpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const newOtpCode = newOtpCodeRecord.code;
    await ResetPasswordScreen.fillConfirmCode(newOtpCode);
    await ResetPasswordScreen.clickBackButton();
    await ResetPasswordScreen.clickLoginLink();
    await LoginScreen.login(userData.email, password);
    //додати перевірку
  });
});
