import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class LoginScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.login}`, 'Login');
  }
}

export default new LoginScreen();
