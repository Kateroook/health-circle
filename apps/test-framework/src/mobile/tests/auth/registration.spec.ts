import { UserFactory } from '@core/data/factories/user-factory';
import PasswordSetupScreen from '../../screens/password-setup-screen';
import RegisterScreen from '../../screens/register-screen';

describe('Registration', () => {
  it('[HC-34] User registration with minimum possible requirements', async () => {
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
    browser.backend.dbCleaner.add('users', userDbRow.id);

    expect(userDbRow).toMatchObject({
      email: user.email.toLowerCase(),
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  });
});
