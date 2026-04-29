import DashboardScreen from 'src/mobile/screens/dashboard-screen';
import { timeout } from 'src/utils/wait-helper';
import { utils } from '../../../utils/utils';
import LoginScreen from '../../screens/login-screen';
import PasswordSetupScreen from '../../screens/password-setup-screen';
import RegisterScreen from '../../screens/register-screen';
import ResetPasswordScreen from '../../screens/reset-password-screen';

describe('Login', () => {
  //TODO: refactor later
  it('[HC-54] Login with password reset', async () => {
    const userData = await RegisterScreen.register();

    const lastDbUser = await browser.backend.userRepository.getLast('createdAt');

    const otpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const otpCode = otpCodeRecord.code;
    const password = utils.random.password();

    await PasswordSetupScreen.setupPassword(otpCode, password, password);
    await LoginScreen.clickResetPasswordLink();
    const newOtpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const newOtpCode = newOtpCodeRecord.code;
    const newPassword = utils.random.password();
    await ResetPasswordScreen.setupPassword(userData.email, newOtpCode, newPassword, newPassword);
    await LoginScreen.login({ identifier: userData.email, password: newPassword });
    //додати перевірку для наступного екрана
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
    await LoginScreen.login({ identifier: userData.email, password: password });
    //додати перевірку
  });

  it.only('[HC-214] Successful login with valid email and password', async () => {
    const user = await browser.backend.spawnUser();
    await utils.wait.sleep(timeout.long);
    await LoginScreen.openDirectly();
    await LoginScreen.login({
      identifier: user.email,
      password: user.password,
    });

    await DashboardScreen.waitForIsShown();
  });
});
