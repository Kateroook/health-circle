import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class SettingsEditProfileScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.settingsEditProfile}`, 'Settings Edit Profile');
  }

  get phoneInput() {
    return $('~editProfile:phone:input');
  }

  get saveButton() {
    return $('~editProfile:save:button');
  }
}

export default new SettingsEditProfileScreen();
