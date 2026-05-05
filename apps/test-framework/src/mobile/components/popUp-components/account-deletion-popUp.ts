import BaseScreen from '../../screens/base-screen';
export class AccountDeletionDialog extends BaseScreen {
  constructor(resourceId: string) {
    const androidSelector = `android=new UiSelector().resourceId("${resourceId}")`;
    super(androidSelector, undefined);
  }

  get container() {
    return $(this.selector);
  }

  get confirmAccountDeletionButton() {
    return $(`~settings:deleteAccount:modal:confirm:button`);
  }

  get cancelAccountDeletionButton() {
    return $(`~settings:deleteAccount:modal:cancel:button`);
  }

  async clickConfirmAccountDeletionButton() {
    await this.tap(this.confirmAccountDeletionButton);
  }
  async clickCancelAccountDeletionButton() {
    await this.tap(this.cancelAccountDeletionButton);
  }
}
