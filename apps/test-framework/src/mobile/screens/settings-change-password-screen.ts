import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class SettingsChangePasswordScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.settingsChangePassword}`, 'Settings Change Password');
  }

  get oldPasswordInput() {
    return $('~changePassword:oldPassword:input');
  }

  get newPasswordInput() {
    return $('~changePassword:newPassword:input');
  }

  get confirmNewPasswordInput() {
    return $('~changePassword:confirmNewPassword:input');
  }

  get submitButton() {
    return $('~changePassword:submit:button');
  }

  get successModalOkButton() {
    return $('~changePasswordSuccess:ok:button');
  }
}

export default new SettingsChangePasswordScreen();
