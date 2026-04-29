import OnboardingScreen from '../../screens/onboarding-screen';

beforeEach(async () => {
  const bundleId = 'com.healthcircle.app';
  await driver.terminateApp(bundleId);
  await driver.activateApp(bundleId);
});
describe('Onboarding', () => {
  it('[HC-167] Successfull onboarding', async () => {
    await OnboardingScreen.completeOnboarding();
    await expect(OnboardingScreen.registerButton).toBeDisplayed();
  });

  it('[HC-206] Verify redirection to the Registration/Login screen after tapping the skip button', async () => {
    await OnboardingScreen.clickSkipOnboardingButton();
    await expect(OnboardingScreen.registerButton).toBeDisplayed();
  });
});
