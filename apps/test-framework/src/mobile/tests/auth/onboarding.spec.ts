import appHelper from 'src/mobile/helpers/app-helper';
import OnboardingScreen from '../../screens/onboarding-screen';

beforeEach(async () => {
  await appHelper.restartApp();
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
