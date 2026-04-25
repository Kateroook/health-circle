import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class ResetPasswordScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.resetPassword}`, 'ResetPassword');
  }

  get backButton() {
    return $('~auth:back:button');
  }

  get emailInput() {
    return $('~auth:email:input');
  }

  get sendCodeButton() {
    return $('~auth:sendCode:button');
  }

  get loginLink() {
    return $('~auth:login:link');
  }

  get confirmCodeInput() {
    return $('~auth:code:input');
  }

  get newPasswordInput() {
    return $('~auth:newPassword:input');
  }

  get confirmPasswordInput() {
    return $('~auth:confirmNewPassword:input');
  }

  get resetButton() {
    return $('~auth:submit:button');
  }

  get resendCodeLink() {
    return $('~auth:resendCode:link');
  }

  async fillEmail(email?: string) {
    await this.wait(this.emailInput);
    if (email) {
      await this.emailInput.setValue(email);
    }
    await this.tap(this.sendCodeButton);
  }

  async fillConfirmCode(confirmCode?: string) {
    await this.wait(this.confirmCodeInput);
    if (confirmCode) {
      await this.confirmCodeInput.setValue(confirmCode);
    }
  }

  async fillNewPassword(newPassword?: string) {
    await this.wait(this.newPasswordInput);
    if (newPassword) {
      await this.newPasswordInput.setValue(newPassword);
    }
  }

  async fillConfirmPassword(confirmPassword?: string) {
    await this.wait(this.confirmPasswordInput);
    if (confirmPassword) {
      await this.confirmPasswordInput.setValue(confirmPassword);
    }
  }

  async fillAndConfirmPassword(newPassword?: string, confirmPassword?: string) {
    await this.fillNewPassword(newPassword);
    await this.fillConfirmPassword(confirmPassword);
    await this.tap(this.resetButton);
  }

  async setupPassword(email?: string, confirmCode?: string, password?: string, confirmPassword?: string) {
    await this.fillEmail(email);
    await this.fillConfirmCode(confirmCode);
    await this.fillAndConfirmPassword(password, confirmPassword);
  }

  async clickLoginLink() {
    await this.tap(this.loginLink);
  }

  async clickResetButton() {
    await this.tap(this.resetButton);
  }

  async clickBackButton() {
    await this.tap(this.backButton);
  }

  async clickResendCodeLink() {
    await this.tap(this.resendCodeLink);
  }
}

export default new ResetPasswordScreen();
