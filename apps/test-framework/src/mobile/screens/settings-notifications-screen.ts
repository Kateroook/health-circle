import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class SettingsNotificationsScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.settingsNotifications}`, 'Settings Notifications');
  }
}

export default new SettingsNotificationsScreen();
