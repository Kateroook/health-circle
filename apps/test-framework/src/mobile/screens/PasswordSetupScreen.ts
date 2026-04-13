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
    return $('//*[contains(@text, "Надіслати повторно")]');
  }

  async confirmCode(confirmCode?: string) {
    await this.wait(this.confirmCodeInput);
    if (confirmCode) {
      await this.confirmCodeInput.setValue(confirmCode);
    }
  }

  async password(password?: string) {
    await this.wait(this.passwordInput);
    if (password) {
      await this.passwordInput.setValue(password);
    }
  }

  async confirmPassword(confirmPassword?: string) {
    await this.wait(this.passwordInput);
    if (confirmPassword) {
      await this.confirmPasswordInput.setValue(confirmPassword);
    }
  }

  async fillPasswords(password?: string, confirmPassword?: string) {
    await this.password(password);
    await this.confirmPassword(confirmPassword);
    await this.tap(this.confirmButton);
  }

  async fullPasswordSetup(confirmCode?: string, password?: string, confirmPassword?: string) {
    await this.confirmCode(confirmCode);
    await this.fillPasswords(password, confirmPassword);
  }

  async confirmButtonClick() {
    await this.tap(this.confirmButton);
  }

  async backClick() {
    await this.tap(this.backButton);
  }

  async resendCodeClick() {
    await this.tap(this.resendCodeLink);
  }
}

export default new PasswordSetupScreen();
