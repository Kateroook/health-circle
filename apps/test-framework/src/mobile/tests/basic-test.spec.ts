import LoginScreen from '../screens/login-screen';

describe('Basic tests to verify mobile part integrity', () => {
  it.skip('Deep link navigation to login page', async () => {
    await LoginScreen.openDirectly();
    await LoginScreen.waitForIsShown();
  });
});
