import { ComponentsIds, ScreenIds } from '../../../../client/src/utils/testIDs';
import { ConfirmationModal } from '../components/confirmationModal';
import BaseScreen from './base-screen';

class SettingsScreen extends BaseScreen {
  public logoutModal: ConfirmationModal;
  constructor() {
    super(`~${ScreenIds.settings}`, 'settings');
    this.logoutModal = new ConfirmationModal(ComponentsIds.logoutAccountModal);
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
