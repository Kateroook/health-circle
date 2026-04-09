import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class CirclesScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.circles}`, 'Circles');
  }
}

export default new CirclesScreen();
