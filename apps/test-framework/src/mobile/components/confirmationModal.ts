import BaseScreen from '../screens/base-screen';
export class ConfirmationModal extends BaseScreen {
  constructor(resourceId: string) {
    super(`~${resourceId}`, undefined);
  }

  get container() {
    return $(this.selector);
  }

  get confirmButton() {
    return $(`${this.selector}:confirm:button`);
  }

  get cancelButton() {
    return $(`${this.selector}:cancel:button`);
  }

  get header() {
    return $(`${this.selector}:header`);
  }

  async clickConfirmButton() {
    await this.tap(this.confirmButton);
  }
  async clickCancelButton() {
    await this.tap(this.cancelButton);
  }

  async confirm() {
    await this.waitForIsShown();
    await this.clickConfirmButton();
  }

  async cancel() {
    await this.waitForIsShown();
    await this.clickCancelButton();
  }

  async getHeaderText() {
    return await this.header.getText();
  }
}
