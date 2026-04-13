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
    return $('//*[@text="Увійти"]');
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
    return $("//*[@text='Надіслати повторно']");
  }

  async email(email?: string) {
    await this.wait(this.emailInput);
    if (email) {
      await this.emailInput.setValue(email);
    }
    await this.tap(this.sendCodeButton);
  }

  async confirmCode(confirmCode?: string) {
    await this.wait(this.confirmCodeInput);
    if (confirmCode) {
      await this.confirmCodeInput.setValue(confirmCode);
    }
  }

  async newPassword(newPassword?: string) {
    await this.wait(this.newPasswordInput);
    if (newPassword) {
      await this.newPasswordInput.setValue(newPassword);
    }
  }

  async confirmPassword(confirmPassword?: string) {
    await this.wait(this.confirmPasswordInput);
    if (confirmPassword) {
      await this.confirmPasswordInput.setValue(confirmPassword);
    }
  }

  async fillPasswords(newPassword?: string, confirmPassword?: string) {
    await this.newPassword(newPassword);
    await this.confirmPassword(confirmPassword);
    await this.tap(this.resetButton);
  }

  async fullPasswordSetup(email?: string, confirmCode?: string, password?: string, confirmPassword?: string) {
    await this.email(email);
    await this.confirmCode(confirmCode);
    await this.fillPasswords(password, confirmPassword);
  }

  async loginLinkClick() {
    await this.tap(this.loginLink);
  }

  async resetButtonClick() {
    await this.tap(this.resetButton);
  }

  async backClick() {
    await this.tap(this.backButton);
  }

  async resendPasswordClick() {
    await this.tap(this.resendCodeLink);
  }
}

export default new ResetPasswordScreen();
