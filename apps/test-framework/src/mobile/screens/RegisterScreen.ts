import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class RegisterScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.register}`, 'Register');
  }
}

export default new RegisterScreen();
