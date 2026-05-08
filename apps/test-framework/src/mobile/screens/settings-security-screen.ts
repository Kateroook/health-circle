import { ComponentsIds, ScreenIds } from '../../../../client/src/utils/testIDs';
import { ConfirmationModal } from '../components/confirmationModal';
import { SwitchSection } from '../components/switch-section';
import BaseScreen from './base-screen';

const LABEL_TO_SWITCH_KEY = {
  'Push-сповіщення': 'pushNotifications',
  'SMS-сповіщення': 'smsNotifications',
  Геолокація: 'location',
  'Доступ до контактів': 'contacts',
} as const;

class SettingsSecurityScreen extends BaseScreen {
  public deleteAccountModal: ConfirmationModal;
  public switches: SwitchSection<typeof LABEL_TO_SWITCH_KEY>;

  constructor() {
    super(`~${ScreenIds.settingsSecurity}`, 'settings/security');
    this.deleteAccountModal = new ConfirmationModal(ComponentsIds.deleteAccountModal);
    this.switches = new SwitchSection(LABEL_TO_SWITCH_KEY, (key: string) => `security:${key}:switch`);
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
