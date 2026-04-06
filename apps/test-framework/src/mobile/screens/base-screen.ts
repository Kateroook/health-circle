import { $ } from '@wdio/globals';

export default class BaseScreen {
  private selector: string;

  /**
   * @param selector - Unique locator for this screen (e.g. title id),
   * to check if the screen is really loaded.
   */
  constructor(selector: string) {
    this.selector = selector;
  }

  /**
   * Waits for the main element of the screen to appear.
   */
  async waitForIsShown(timeout = 10000): Promise<void> {
    const element = await $(this.selector);
    await element.waitForDisplayed({
      timeout,
      timeoutMsg: `Screen with locator "${this.selector}" did not load within ${timeout}ms.`,
    });
  }

  /**
   * Hides the keyboard if it is open.
   * In mobile apps, the keyboard often overlaps buttons, causing tests to fail.
   */
  async hideKeyboard(): Promise<void> {
    if (await driver.isKeyboardShown()) {
      await driver.hideKeyboard();
    }
  }

  /**
   * Universal method for clicking with waiting (to avoid "flaky" tests)
   */
  async tap(locator: string): Promise<void> {
    const element = await $(locator);
    await element.waitForDisplayed();
    await element.click();
  }
}
