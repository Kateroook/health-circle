import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class OnboardingScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.onboarding}`, '/');
  }

  get closeButton() {
    return $('~onboarding:close:button');
  }

  get nextButton() {
    return $('~onboarding:nextSlide:button');
  }

  get prevButton() {
    return $('~onboarding:prevSlide:button');
  }

  get registerButton() {
    return $('~onboarding:register:button');
  }

  get loginButton() {
    return $('~onboarding:login:button');
  }

  async closeOnboarding() {
    await this.tap(this.closeButton);
  }

  async onboarding() {
    await this.waitForIsShown();
    await this.tap(this.nextButton);
    await this.tap(this.nextButton);
    await this.tap(this.nextButton);
  }

  async clickprevButton() {
    await this.tap(this.prevButton);
  }

  async clicknextButton() {
    await this.tap(this.nextButton);
  }

  async clickregisterButton() {
    await this.tap(this.registerButton);
  }

  async clickloginButton() {
    await this.tap(this.loginButton);
  }
}

export default new OnboardingScreen();
