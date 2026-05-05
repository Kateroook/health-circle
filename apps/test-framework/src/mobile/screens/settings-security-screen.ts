import { ComponentsIds, ScreenIds } from '../../../../client/src/utils/testIDs';
import { AccountDeletionDialog } from '../components/popUp-components/account-deletion-popUp';
import BaseScreen from './base-screen';

class SettingsSecurityScreen extends BaseScreen {
  public deleteAccountDialog: AccountDeletionDialog;
  constructor() {
    super(`~${ScreenIds.settingsSecurity}`, 'settings/security');
    this.deleteAccountDialog = new AccountDeletionDialog(ComponentsIds.deleteAccountPopUp);
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
