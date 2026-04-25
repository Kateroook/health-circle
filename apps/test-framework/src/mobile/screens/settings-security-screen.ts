import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class SettingsSecurityScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.settingsSecurity}`, 'Settings Security');
  }

  get changePasswordButton() {
    return $('~security:changePassword:button');
  }

  get deleteAccountButton() {
    return $('~security:deleteAccount:button');
  }

  async goToChangePassword() {
    await this.changePasswordButton.click();
  }
}

export default new SettingsSecurityScreen();
