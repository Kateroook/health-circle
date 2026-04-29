import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class PushPermissionScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.pushPermission}`, 'PushPermissionScreen');
  }

  get skipPushButton() {
    return $('~auth:skipPush:button');
  }

  get allowPushButton() {
    return $('~auth:allowPush:button');
  }

  async clickSkipPushButton() {
    await this.tap(this.skipPushButton);
  }

  async clickAllowPushButton() {
    await this.tap(this.allowPushButton);
  }
}

export default new PushPermissionScreen();
