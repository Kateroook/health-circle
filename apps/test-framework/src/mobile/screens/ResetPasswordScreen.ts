import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class ResetPasswordScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.resetPassword}`, 'ResetPassword');
  }
}

export default new ResetPasswordScreen();
