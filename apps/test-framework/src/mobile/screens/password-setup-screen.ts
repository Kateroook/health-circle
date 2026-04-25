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
      await this.confirmCodeInput.setValue(confirmCode);
    }
  }

  async fillPassword(password?: string) {
    await this.wait(this.passwordInput);
    if (password) {
      await this.passwordInput.setValue(password);
    }
  }

  async fillConfirmPassword(confirmPassword?: string) {
    await this.wait(this.confirmPasswordInput);
    if (confirmPassword) {
      await this.confirmPasswordInput.setValue(confirmPassword);
    }
  }

  async fillAndConfirmPassword(password?: string, confirmPassword?: string) {
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword);
    await this.tap(this.confirmButton);
  }

  async setupPassword(confirmCode?: string, password?: string, confirmPassword?: string) {
    await this.fillConfirmCode(confirmCode);
    await this.fillAndConfirmPassword(password, confirmPassword);
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
