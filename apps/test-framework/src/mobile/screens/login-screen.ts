import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class LoginScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.login}`, 'Login');
  }

  get identifierInput() {
    return $('~auth:identifier:input');
  }

  get passwordInput() {
    return $('~auth:password:input');
  }

  get loginButton() {
    return $('~auth:login:button');
  }

  get resetPasswordLink() {
    return $('~auth:forgotPassword:link');
  }

  get registerLink() {
    return $('~auth:register:link');
  }

  async fillIdentifier(contact?: string) {
    await this.wait(this.identifierInput);
    if (contact) {
      await this.identifierInput.setValue(contact);
    }
  }

  async fillPassword(password?: string) {
    await this.wait(this.passwordInput);
    if (password) {
      await this.passwordInput.setValue(password);
    }
  }

  async login(options: { identifier?: string; password?: string }) {
    await this.fillIdentifier(options.identifier);
    await this.fillPassword(options.password);
    await this.tap(this.loginButton);
  }

  async clickLoginButton() {
    await this.tap(this.loginButton);
  }

  async clickResetPasswordLink() {
    await this.tap(this.resetPasswordLink);
  }

  async clickRegisterLink() {
    await this.tap(this.registerLink);
  }
}

export default new LoginScreen();
