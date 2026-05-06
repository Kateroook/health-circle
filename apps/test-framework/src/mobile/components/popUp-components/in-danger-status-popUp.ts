import BaseScreen from '../../screens/base-screen';
export class DangerStatusDialog extends BaseScreen {
  constructor(resourceId: string) {
    const androidSelector = `android=new UiSelector().resourceId("${resourceId}")`;
    super(androidSelector, undefined);
  }

  get container() {
    return $(this.selector);
  }

  get confirmDangerStatusButton() {
    return $(`~mainStatus:dangerConfirm:modal:confirm:button`);
  }

  get cancelDangerStatusButton() {
    return $(`~mainStatus:dangerConfirm:modal:cancel:button`);
  }

  async clickConfirmDangerStatusButton() {
    await this.tap(this.confirmDangerStatusButton);
  }
  async clickCancelDangerStatusButton() {
    await this.tap(this.cancelDangerStatusButton);
  }
}
