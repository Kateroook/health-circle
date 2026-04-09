import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class OnboardingScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.onboarding}`, '/');
  }
}

export default new OnboardingScreen();
