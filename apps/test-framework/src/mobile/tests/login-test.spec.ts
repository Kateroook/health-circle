import { utils } from '../../utils/utils';
import LoginScreen from '../screens/login-screen';
import PasswordSetupScreen from '../screens/password-setup-screen';
import RegisterScreen from '../screens/register-screen';
import ResetPasswordScreen from '../screens/reset-password-screen';

describe('Login', () => {
  it('[HC-54] Login with password reset', async () => {
    const userData = await RegisterScreen.registration();

    const lastDbUser = await browser.backend.userRepository.getLast('createdAt');

    const otpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const otpCode = otpCodeRecord.code;
    const password = utils.random.password();

    await PasswordSetupScreen.passwordSetup(otpCode, password, password);
    await LoginScreen.clickResetPasswordLink();
    const newOtpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const newOtpCode = newOtpCodeRecord.code;
    const newPassword = utils.random.password();
    await ResetPasswordScreen.fullPasswordSetup(userData.email, newOtpCode, newPassword, newPassword);
    await LoginScreen.login(userData.email, newPassword);
    //додати перевірку для наступного екрана
  });

  it('[HC-60] Login with old password after password reset without updating', async () => {
    const userData = await RegisterScreen.registration();

    const lastDbUser = await browser.backend.userRepository.getLast('createdAt');

    const otpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const otpCode = otpCodeRecord.code;
    const password = utils.random.password();

    await PasswordSetupScreen.passwordSetup(otpCode, password, password);
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
