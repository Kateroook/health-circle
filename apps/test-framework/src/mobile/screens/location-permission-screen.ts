import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class LocationPermissionScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.locationPermission}`, 'LocationPermissionScreen');
  }

  get skipLocationButton() {
    return $('~auth:skipLocation:button');
  }

  get allowLocationButton() {
    return $('~auth:allowLocation:button');
  }

  async clickSkipLocationButton() {
    await this.tap(this.skipLocationButton);
  }

  async clickAllowLocationButton() {
    await this.tap(this.allowLocationButton);
  }
}

export default new LocationPermissionScreen();
