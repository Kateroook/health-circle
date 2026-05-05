import BaseScreen from '../../screens/base-screen';
export class AccountLogoutDialog extends BaseScreen {
  constructor(resourceId: string) {
    const androidSelector = `android=new UiSelector().resourceId("${resourceId}")`;
    super(androidSelector, undefined);
  }

  get container() {
    return $(this.selector);
  }

  get confirmAccountLogoutButton() {
    return $(`~settings:logout:modal:confirm:button`);
  }

  get cancelAccountLogoutButton() {
    return $(`~settings:logout:modal:cancel:button`);
  }

  async clickConfirmAccountLogoutButton() {
    await this.tap(this.confirmAccountLogoutButton);
  }
  async clickCancelAccountLogoutButton() {
    await this.tap(this.cancelAccountLogoutButton);
  }
}
