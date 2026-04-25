import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class PushPermissionScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.pushPermission}`, 'PushPermissionScreen');
  }
}

export default new PushPermissionScreen();
