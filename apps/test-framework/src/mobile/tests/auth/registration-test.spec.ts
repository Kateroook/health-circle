import { utils } from '../../../utils/utils';
import LoginScreen from '../../screens/login-screen';
import passwordSetupScreen from '../../screens/password-setup-screen';
import RegisterScreen from '../../screens/register-screen';

describe('Registration', () => {
  it('[HC-34] User registration with minimum possible requirements', async () => {
    const firstName = utils.random.string({
      length: 2,
      includeUpper: true,
      includeLower: true,
      includeNumbers: true,
      includeSpecial: true,
    });
    const lastName = utils.random.string({
      length: 2,
      includeUpper: true,
      includeLower: true,
      includeNumbers: true,
      includeSpecial: true,
    });

    const userData = await RegisterScreen.register({ firstName, lastName });

    const lastDbUser = await browser.backend.userRepository.getLast('createdAt');
    await expect(lastDbUser).toBeDefined();
    expect(lastDbUser).toMatchObject({
      email: userData.email.toLowerCase(),
      phone: userData.phone,
      firstName: firstName,
      lastName: lastName,
    });
  });

  it('[HC-35] Confirmation email and password setting work correct', async () => {
    const userData = await RegisterScreen.register();
    const lastDbUser = await browser.backend.userRepository.getLast('createdAt');
    const otpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const otpCode = otpCodeRecord.code;
    const password = utils.random.password();

    await passwordSetupScreen.setupPassword(otpCode, password, password);
    await LoginScreen.login({
      identifier: userData.email,
      password: password,
    });
    //додати ще перевівірку, що показується перше вікно після логіну
  });

  it('[HC-47] Password setting up after entering expired or invalid confirmation code', async () => {
    const userDate = await RegisterScreen.register();

    const lastDbUser = await browser.backend.userRepository.getLast('createdAt');

    const otpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const otpCode = otpCodeRecord.code;
    await browser.pause(61000);
    await passwordSetupScreen.clickResendCodeLink();
    const newOtpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    await expect(newOtpCodeRecord).not.toBe(otpCode);
    const password = utils.random.password();

    await passwordSetupScreen.setupPassword(otpCode, password, password);
    await LoginScreen.login({
      identifier: userDate.email,
      password: password,
    });
    //додати ще перевірку, що показується перше вікно після логіну
  });
});
