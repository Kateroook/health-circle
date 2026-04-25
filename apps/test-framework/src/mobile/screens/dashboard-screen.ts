import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class DashboardScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.dashboard}`, 'Dashboard');
  }
}

export default new DashboardScreen();
