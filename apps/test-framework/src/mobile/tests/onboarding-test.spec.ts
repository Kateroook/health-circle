import OnboardingScreen from '../screens/onboarding-screen';

describe('Login', () => {
  it('[HC-167] Successfull onboarding', async () => {
    await OnboardingScreen.completeOnboarding();
    //додати перевірку
  });

  it('[HC-206] Verify redirection to the Registration/Login screen after tapping the skip button', async () => {
    await OnboardingScreen.clickSkipOnboardingButton();
    //додати перевірку
  });
});
