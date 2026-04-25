import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class LocationPermissionScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.locationPermission}`, 'LocationPermissionScreen');
  }
}

export default new LocationPermissionScreen();
