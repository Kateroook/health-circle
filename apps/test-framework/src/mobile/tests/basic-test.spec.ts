import { $, expect as wdioExpect } from '@wdio/globals';
import LoginScreen from '../screens/login-screen';

describe('Basic tests to verify mobile part integrity', () => {
  it('should navigate to registration page and verify instructions text', async () => {
    const registerButton = await $('android=new UiSelector().description("Зареєструватися")');

    await registerButton.waitForDisplayed({ timeout: 10000 });

    await registerButton.click();

    const instructionText = await $('android=new UiSelector().text("Введи номер телефону та електронну пошту")');
    const actualText = await instructionText.getText();
    console.log(`--- Found text on screen: [${actualText}] ---`);

    await wdioExpect(instructionText).toBeDisplayed();

    wdioExpect(actualText).toBe('Введи номер телефону та електронну пошту');
  });

  it.only('Deep link navigation to login page', async () => {
    await LoginScreen.openDirectly();
    await LoginScreen.waitForIsShown();
  });
});
