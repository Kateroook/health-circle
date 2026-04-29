import { UserFactory } from '@core/data/factories/user-factory';
import { utils } from '../../../utils/utils';
import LoginScreen from '../../screens/login-screen';
import PasswordSetupScreen from '../../screens/password-setup-screen';
import RegisterScreen from '../../screens/register-screen';

describe('Registration', () => {
  it.only('[HC-34] User registration with minimum possible requirements', async () => {
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
        // email: user.email,
      })
    )[0];
    console.log(userDbRow);
    user.id = userDbRow.id;
    browser.backend.dbCleaner.add('users', user.id);

    const confirmationCode = (await browser.backend.confirmationCodeRepository.getLastUserCode(user.id)).code;

    await PasswordSetupScreen.setupPassword(confirmationCode, user.password, user.password);
  });

  it('[HC-35] Confirmation email and password setting work correct', async () => {
    const userData = await RegisterScreen.register();
    const lastDbUser = await browser.backend.userRepository.getLast('createdAt');
    const otpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const otpCode = otpCodeRecord.code;
    const password = utils.random.password();

    await PasswordSetupScreen.setupPassword(otpCode, password, password);
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
    await PasswordSetupScreen.clickResendCodeLink();
    const newOtpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    await expect(newOtpCodeRecord).not.toBe(otpCode);
    const password = utils.random.password();

    await PasswordSetupScreen.setupPassword(otpCode, password, password);
    await LoginScreen.login({
      identifier: userDate.email,
      password: password,
    });
    //додати ще перевірку, що показується перше вікно після логіну
  });
});
