import BaseScreen from '../../screens/base-screen';
export class SafeStatusDialog extends BaseScreen {
  constructor(resourceId: string) {
    const androidSelector = `android=new UiSelector().resourceId("${resourceId}")`;
    super(androidSelector, undefined);
  }

  get container() {
    return $(this.selector);
  }

  get confirmSafeStatusButton() {
    return $(`~mainStatus:safetyConfirm:modal:confirm:button`);
  }

  get cancelSafeStatusButton() {
    return $(`~mainStatus:safetyConfirm:modal:cancel:button`);
  }

  async clickConfirmSafeStatusButton() {
    await this.tap(this.confirmSafeStatusButton);
  }
  async clickCancelSafeStatusButton() {
    await this.tap(this.cancelSafeStatusButton);
  }
}
