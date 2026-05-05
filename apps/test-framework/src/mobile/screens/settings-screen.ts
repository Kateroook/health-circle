import { ComponentsIds, ScreenIds } from '../../../../client/src/utils/testIDs';
import { AccountLogoutDialog } from '../components/popUp-components/account-logout-popUp';
import BaseScreen from './base-screen';

class SettingsScreen extends BaseScreen {
  public logoutAccountDialog: AccountLogoutDialog;
  constructor() {
    super(`~${ScreenIds.settings}`, 'settings');
    this.logoutAccountDialog = new AccountLogoutDialog(ComponentsIds.logoutAccountPopUp);
  }

  get notificationsButton() {
    return $('~settings:notifications:button');
  }

  get securityButton() {
    return $('~settings:security:button');
  }

  get editProfileButton() {
    return $('~settings:editProfile:button');
  }

  get updateLocationButton() {
    return $('~settings:updateLocation:button');
  }

  get logoutButton() {
    return $('~settings:logout:button');
  }

  get logoutModal() {
    return $('~settings:logout:modal');
  }

  async goToNotifications() {
    await this.notificationsButton.click();
  }

  async goToSecurity() {
    await this.securityButton.click();
  }

  async goToEditProfile() {
    await this.editProfileButton.click();
  }

  async clickLogoutButton() {
    await this.tap(this.logoutButton);
  }
}

export default new SettingsScreen();
