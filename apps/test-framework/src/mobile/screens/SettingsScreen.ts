import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class SettingsScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.settings}`, 'Settings');
  }
}

export default new SettingsScreen();
