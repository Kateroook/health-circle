import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class PasswordSetupScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.passwordSetup}`, 'PasswordSetup');
  }
}

export default new PasswordSetupScreen();
