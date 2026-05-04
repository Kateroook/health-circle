import { NotificationTemplates, NotificationType } from '../../../../core-api/src/notifications/notification-types';

export class NotificationHelper {
  /**
   * Clean ADB. Call in beforeEach() tests.
   */
  static async clearAll() {
    try {
      await driver.execute('mobile: shell', { command: 'service call notification 1' });
    } catch (e) {
      console.warn('Не вдалося очистити шторку сповіщень:', e);
    }
  }

  /**
   * Open notifications panel (Android).
   */
  static async open() {
    await driver.openNotifications();
  }

  /**
   * Generate expected notification text based on backend templates.
   */
  static getExpectedContent(type: NotificationType, payloadData: any = {}) {
    const template = NotificationTemplates[type];
    const title = template.title;
    const body = typeof template.body === 'function' ? template.body(payloadData) : template.body;

    return { title, body };
  }

  /**
   * Find notification in the panel and wait for it to appear.
   * Return locators, so you can do expect() in the test.
   */
  static async waitForNotification(type: NotificationType, payloadData: any = {}, timeout = 15000) {
    const { title, body } = this.getExpectedContent(type, payloadData);

    // Find exact match for title
    const titleLocator = await $(`//*[@text="${title}"]`);

    // Android often truncates long texts (body) with three dots (...).
    // So for body we use contains and check only the first 25 characters.
    const safeBodyPart = body.substring(0, 25);
    const bodyLocator = await $(`//*[contains(@text, "${safeBodyPart}")]`);

    await titleLocator.waitForDisplayed({ timeout, interval: 1000 });

    return { titleLocator, bodyLocator, title, body };
  }

  /**
   * Full flow: opens the panel, finds the required notification, and clicks on it.
   */
  static async openAndTap(type: NotificationType, payloadData: any = {}) {
    await this.open();
    const { titleLocator } = await this.waitForNotification(type, payloadData);
    await titleLocator.click();
  }

  /**
   * For future features (e.g., Roll Call): clicks a specific button inside the notification.
   */
  static async openAndTapButton(type: NotificationType, buttonText: string, payloadData: any = {}) {
    await this.open();
    // First, make sure that our specific notification appeared
    await this.waitForNotification(type, payloadData);

    // Find button inside the panel
    const buttonLocator = await $(`//*[@text="${buttonText}"]`);
    await buttonLocator.waitForDisplayed({ timeout: 5000 });
    await buttonLocator.click();
  }
}
