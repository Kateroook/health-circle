import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class LoginScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.login}`, 'Login');
  }

  get contactInput() {
    return $('~auth:email:input');
  }

  get passwordInput() {
    return $('~auth:password:input');
  }

  get loginButton() {
    return $('~auth:login:button');
  }

  get resetPasswordLink() {
    return $('//*[contains(@text, "Скинути")]');
  }

  get registerLink() {
    return $('//*[contains(@text, "Зареєструватися")]');
  }

  async contact(contact?: string) {
    await this.wait(this.contactInput);
    if (contact) {
      await this.contactInput.setValue(contact);
    }
  }

  async password(password?: string) {
    await this.wait(this.passwordInput);
    if (password) {
      await this.passwordInput.setValue(password);
    }
  }

  async fullLogin(contact?: string, password?: string) {
    await this.contact(contact);
    await this.password(password);
    await this.tap(this.loginButton);
  }

  async loginButtonClick() {
    await this.tap(this.loginButton);
  }

  async resetPasswordLinkClick() {
    await this.tap(this.resetPasswordLink);
  }

  async registerLinkClick() {
    await this.tap(this.registerLink);
  }
}

export default new LoginScreen();
