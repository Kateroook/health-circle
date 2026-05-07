import { ComponentsIds, ScreenIds } from '../../../../client/src/utils/testIDs';
import { ConfirmationModal } from '../components/confirmationModal';
import BaseScreen from './base-screen';

class SettingsSecurityScreen extends BaseScreen {
  public deleteAccountModal: ConfirmationModal;
  constructor() {
    super(`~${ScreenIds.settingsSecurity}`, 'settings/security');
    this.deleteAccountModal = new ConfirmationModal(ComponentsIds.deleteAccountModal);
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

  async clickDeleteAccountButton() {
    await this.tap(this.deleteAccountButton);
  }
}

export default new SettingsSecurityScreen();
