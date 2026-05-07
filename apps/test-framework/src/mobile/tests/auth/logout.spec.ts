import DashboardScreen from 'src/mobile/screens/dashboard-screen';
import SettingsScreen from 'src/mobile/screens/settings-screen';
import LoginScreen from '../../screens/login-screen';
import OnboardingScreen from '../../screens/onboarding-screen';

describe('Account logout', () => {
  it('[HC-70] Successfull user logout', async () => {
    await OnboardingScreen.clickSkipOnboardingButton();
    await OnboardingScreen.clickLoginButton();
    const user = await browser.backend.spawnUser();
    await LoginScreen.openDirectly();
    await LoginScreen.login({
      identifier: user.email,
      password: user.password,
    });
    await DashboardScreen.waitForIsShown();
    await SettingsScreen.openDirectly();
    await SettingsScreen.clickLogoutButton();
    await SettingsScreen.logoutModal.confirm();
    await LoginScreen.waitForIsShown();
    await expect(LoginScreen.root).toBeDisplayed();
  });
});
