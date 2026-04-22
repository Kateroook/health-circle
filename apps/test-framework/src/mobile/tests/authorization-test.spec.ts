import { utils } from '../../utils/utils';
import LoginScreen from '../screens/login-screen';
import PasswordSetupScreen from '../screens/password-setup-screen';
import RegisterScreen from '../screens/register-screen';

describe('Authorization', () => {
  it('[HC-74] Account creation with the first login', async () => {
    const middleName = utils.random.middleName();

    const userData = await RegisterScreen.registration({ middleName });

    const lastDbUser = await browser.backend.userRepository.getLast('createdAt');
    await expect(lastDbUser).toBeDefined();
    expect(lastDbUser).toMatchObject({
      email: userData.email.toLowerCase(),
      phone: userData.phone,
      firstName: userData.firstName,
      lastName: userData.lastName,
      middleName: middleName,
    });

    const otpCodeRecord = await browser.backend.confirmationCodeRepository.getLastUserCode(lastDbUser!.id);
    const otpCode = otpCodeRecord.code;
    const password = utils.random.password();

    await PasswordSetupScreen.passwordSetup(otpCode, password, password);
    await LoginScreen.login(userData.email, password);
    //додати ще перевівірку, що показується перше вікно після логіну
  });
});
