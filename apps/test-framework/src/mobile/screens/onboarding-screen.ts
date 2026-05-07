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
    return $(`android=new UiSelector().resourceId("onboarding:nextSlide:button")`);
  }

  get prevButton() {
    return $(`android=new UiSelector().resourceId("onboarding:prevSlide:button")`);
  }

  get registerButton() {
    return $('~onboarding:register:button');
  }

  get loginButton() {
    return $('~onboarding:login:button');
  }

  async clickSkipOnboardingButton() {
    await this.tap(this.closeButton);
  }

  async completeOnboarding() {
    await this.waitForIsShown();
    await this.swipeNext();
    await this.swipeNext();
    await this.swipeNext();
    await this.swipeNext();
    await this.swipeNext();
  }

  async swipePrevious() {
    await browser.swipe({
      direction: 'right',
      scrollableElement: this.root,
      percent: 0.8,
      duration: 100,
    });
  }

  async swipeNext() {
    await browser.swipe({
      direction: 'left',
      scrollableElement: this.root,
      percent: 0.8,
      duration: 100,
    });
  }

  async clickregisterButton() {
    await this.tap(this.registerButton);
  }

  async clickLoginButton() {
    await this.tap(this.loginButton);
  }
}

export default new OnboardingScreen();
