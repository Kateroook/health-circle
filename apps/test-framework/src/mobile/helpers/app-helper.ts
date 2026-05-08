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
    await el.waitForExist();

    const location = await el.getLocation();
    const { width, height } = await driver.getWindowRect();

    // If the element's Y-coordinate is below the safe zone
    if (location.y > height * safeZoneRatio) {
      await driver
        .action('pointer', { parameters: { pointerType: 'touch' } })
        .move({ x: width / 2, y: height * 0.8 }) // Start swipe from the bottom
        .down()
        .pause(100)
        .move({ x: width / 2, y: height * 0.4, duration: 500 }) // Swipe up to the center
        .up()
        .perform();

      // Wait for the system to complete the inertial scroll animation
      await browser.pause(500);
    }
  }
}

export default new AppHelper();
