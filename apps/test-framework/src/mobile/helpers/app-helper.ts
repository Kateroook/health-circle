import { waitHelper } from 'src/utils/wait-helper';

export class AppHelper {
  async restartApp() {
    const bundleId = 'com.healthcircle.app';
    await driver.terminateApp(bundleId);
    await driver.activateApp(bundleId);
  }

  async closeApp() {
    await driver.pressKeyCode(3);
  }

  /**
   * Checks if an element is not blocked by the footer and pulls it up with a swipe if necessary.
   * @param el WebdriverIO element, which needs to be revealed
   * @param safeZoneRatio Percentage of the screen top that is considered "safe" (default is 90%)
   */
  async swipeUpToReveal(el: WebdriverIO.Element, safeZoneRatio = 0.9) {
    const { width, height } = await driver.getWindowRect();

    // Скролимо вниз поки елемент не з'явиться в DOM
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await el.isExisting();
      if (exists) {
        const location = await el.getLocation();
        if (location.y <= height * safeZoneRatio) return; // вже у зоні
      }

      await driver
        .action('pointer', { parameters: { pointerType: 'touch' } })
        .move({ x: width / 2, y: height * 0.8 })
        .down()
        .pause(100)
        .move({ x: width / 2, y: height * 0.4, duration: 500 })
        .up()
        .perform();

      await browser.pause(500);
    }

    // Якщо після всіх спроб не знайшли — вже чекаємо явно
    await el.waitForExist({ timeout: waitHelper.resolveTimeout(5_000) });
  }
}

export default new AppHelper();
