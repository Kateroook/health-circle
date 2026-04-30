import { $ } from '@wdio/globals';

export default class BaseScreen {
  protected selector: string;
  private readonly scheme: string = 'client';
  private readonly path?: string;

  /**
   * @param selector - Unique locator for this screen (e.g. title id),
   * to check if the screen is really loaded.
   */
  constructor(selector: string, path?: string) {
    this.selector = selector;
    this.path = path;
  }

  get root() {
    return $(this.selector);
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

  async wait(target: WebdriverIO.Element | ChainablePromiseElement, timeout = 1000): Promise<void> {
    const el = await target;

    await (el as any).waitForDisplayed({
      timeoutMsg: `Element with locator "${(el as any).selector}" did not load within ${timeout}ms.`,
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
  async tap(target: string | WebdriverIO.Element | ChainablePromiseElement, timeout = 1000): Promise<void> {
    const element = (typeof target === 'string' ? await $(target) : await target) as any;
    const identifier = element.selector || target.toString();
    await element.waitForDisplayed({
      timeoutMsg: `Element with locator "${identifier}" did not load within ${timeout}ms.`,
    });

    await element.click();
  }

  /**
   * Teleports the application to the specified screen via Deep Link.
   * @param path Path in the router (e.g. 'login' or 'tabs/profile')
   */
  async openViaDeepLink(path: string): Promise<void> {
    const url = `${this.scheme}://${path}`;

    console.log(`Opening deep link: ${url}`);

    await browser.execute('mobile: deepLink', {
      url: url,
      package: 'com.healthcircle.app',
    });
  }

  async openDirectly(): Promise<void> {
    if (!this.path) {
      throw new Error('Path is not defined');
    }

    await this.openViaDeepLink(this.path);
  }
}
