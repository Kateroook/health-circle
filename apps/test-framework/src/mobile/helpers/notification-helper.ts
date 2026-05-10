import { NotificationTemplates, NotificationType } from '../../../../core-api/src/notifications/notification-types';
import { timeout as setTimeout } from '../../utils/wait-helper';

export class NotificationHelper {
  /**
   * Clean ADB. Call in beforeEach() tests.
   */
  async clearAll() {
    try {
      await driver.execute('mobile: shell', { command: 'service call notification 1' });
    } catch (e) {
      console.warn('Не вдалося очистити шторку сповіщень:', e);
    }
  }

  /**
   * Open notifications panel (Android).
   */
  async open() {
    await driver.openNotifications();
  }

  async close() {
    try {
      await driver.execute('mobile: shell', { command: 'cmd statusbar collapse' });
      await browser.pause(500);
    } catch (e) {
      console.warn("Couldn't close notification panel via ADB:", e);
    }
  }

  /**
   * Generate expected notification text based on backend templates.
   */
  getExpectedContent(type: NotificationType, payloadData: any = {}) {
    const template = NotificationTemplates[type];
    const title = template.title;
    const body = typeof template.body === 'function' ? template.body(payloadData) : template.body;

    return { title, body };
  }

  escapeXPathString(str: string) {
    if (!str.includes("'")) return `'${str}'`;
    if (!str.includes('"')) return `"${str}"`;
    return `concat('${str.split("'").join(`', "'", '`)}')`;
  }

  /**
   * Find notification in the panel and wait for it to appear.
   * Return locators, so you can do expect() in the test.
   */
  async waitForNotification(type: NotificationType, payloadData: any = {}, timeout = setTimeout.extraLong * 2) {
    const { title: templateTitle, body: templateBody } = this.getExpectedContent(type, payloadData);

    // Find match for title (using contains to handle App Name prefixing)
    const escapedTitle = this.escapeXPathString(templateTitle);
    const titleLocator = await $(`//*[contains(@text, ${escapedTitle})]`);

    // Android often truncates long texts (body) with three dots (...),
    // and newlines might be rendered differently.
    // So for body we use contains and check only the first 25 characters of the first line.
    const safeBodyPart = templateBody.split('\n')[0].substring(0, 25);
    const escapedBodyPart = this.escapeXPathString(safeBodyPart);
    const bodyLocator = await $(`//*[contains(@text, ${escapedBodyPart})]`);
    const [actualTitle, actualBody] = await Promise.all([titleLocator.getText(), bodyLocator.getText()]);

    await titleLocator.waitForDisplayed({ timeout, interval: 1000 });

    return { titleLocator, bodyLocator, templateTitle, templateBody, actualTitle, actualBody };
  }

  /**
   * Full flow: opens the panel, finds the required notification, and clicks on it.
   */
  async openAndTap(type: NotificationType, payloadData: any = {}) {
    await this.open();
    const { titleLocator, bodyLocator, actualBody, actualTitle } = await this.waitForNotification(type, payloadData);
    await titleLocator.click();

    return { titleLocator, bodyLocator, actualBody, actualTitle };
  }

  /**
   * For future features (e.g., Roll Call): clicks a specific button inside the notification.
   */
  async openAndTapButton(type: NotificationType, buttonText: string, payloadData: any = {}) {
    await this.open();
    // First, make sure that our specific notification appeared
    await this.waitForNotification(type, payloadData);

    // Find button inside the panel
    const escapedButtonText = this.escapeXPathString(buttonText);
    const buttonLocator = await $(`//*[@text=${escapedButtonText}]`);
    await buttonLocator.waitForDisplayed({ timeout: setTimeout.long });
    await buttonLocator.click();
  }
}

export default new NotificationHelper();
