import { timeout } from 'src/utils/wait-helper';
import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class PasswordSetupScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.passwordSetup}`, 'PasswordSetup');
  }

  get backButton() {
    return $('~auth:back:button');
  }

  get confirmCodeInput() {
    return $('~auth:code:input');
  }

  get passwordInput() {
    return $('~auth:password:input');
  }

  get confirmPasswordInput() {
    return $('~auth:confirmPassword:input');
  }

  get confirmButton() {
    return $('~auth:submit:button');
  }

  get resendCodeLink() {
    return $('~auth:resendCode:link');
  }

  async fillConfirmCode(confirmCode?: string) {
    await this.wait(this.confirmCodeInput);
    if (confirmCode) {
      await this.confirmCodeInput.click();

      await browser.keys(confirmCode.split(''));

      await browser.pause(200);
    }
  }

  async fillPassword(password?: string) {
    await this.wait(this.passwordInput);
    if (password) {
      await this.passwordInput.click();
      await browser.pause(500);
      await browser.keys(password.split(''));
    }
  }

  async fillConfirmPassword(confirmPassword?: string) {
    await this.wait(this.confirmPasswordInput);
    if (confirmPassword) {
      await this.confirmPasswordInput.click();
      await browser.pause(500);
      await browser.keys(confirmPassword.split(''));
    }
  }

  async fillAndConfirmPassword(password?: string, confirmPassword?: string) {
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword);

    if (await browser.isKeyboardShown()) {
      await browser.hideKeyboard();
    }

    await this.tap(this.confirmButton);
  }

  async setupPassword(confirmCode?: string, password?: string, confirmPassword?: string) {
    console.log('CONFIRM CODE:', confirmCode);
    // Disable idle timeout because the 60s countdown timer on this screen prevents UiAutomator2 from ever becoming idle, causing click/setValue to hang.
    await browser.updateSettings({ waitForIdleTimeout: 0 });

    await this.fillConfirmCode(confirmCode);
    if (await browser.isKeyboardShown()) {
      await browser.hideKeyboard();
    }
    await this.fillAndConfirmPassword(password, confirmPassword);

    // Restore default idle timeout
    await browser.updateSettings({ waitForIdleTimeout: timeout.extraLong });
  }

  async clickConfirmButton() {
    await this.tap(this.confirmButton);
  }

  async clickBackButton() {
    await this.tap(this.backButton);
  }

  async clickResendCodeLink() {
    await this.tap(this.resendCodeLink);
  }
}

export default new PasswordSetupScreen();
