import DashboardScreen from 'src/mobile/screens/dashboard-screen';
import SettingsSecurityScreen from 'src/mobile/screens/settings-security-screen';
import LoginScreen from '../../screens/login-screen';
import OnboardingScreen from '../../screens/onboarding-screen';

describe('Account deletion', () => {
  it('[HC-71] Successfull account deletion', async () => {
    await OnboardingScreen.completeOnboarding();
    await OnboardingScreen.clickloginButton();
    const user = await browser.backend.spawnUser();
    await LoginScreen.login({
      identifier: user.email,
      password: user.password,
    });
    await DashboardScreen.waitForIsShown();
    await SettingsSecurityScreen.openDirectly();
    await SettingsSecurityScreen.waitForIsShown();
    await SettingsSecurityScreen.clickDeleteAccountButton();
    await SettingsSecurityScreen.deleteAccountDialog.waitForIsShown();
    await SettingsSecurityScreen.deleteAccountDialog.clickConfirmAccountDeletionButton();
    await LoginScreen.waitForIsShown();

    const userDbRows = await browser.backend.userRepository.findBy({
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    expect(userDbRows[0]).toBeUndefined();
  });
});
