import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class ForgotPasswordScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.forgotPassword}`, 'ForgotPassword');
  }
}

export default new ForgotPasswordScreen();
