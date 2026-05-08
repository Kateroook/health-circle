import BaseScreen from '../screens/base-screen';

export class Switch extends BaseScreen {
  constructor(resourceId: string) {
    super(`~${resourceId}`, undefined);
  }

  get container() {
    return $(this.selector);
  }

  async getValue(): Promise<boolean> {
    const el = await this.container;
    const isChecked = await el.getAttribute('checked');
    return isChecked === 'true';
  }

  async toggle() {
    await this.tap(this.container);
  }

  async setValue(value: boolean) {
    const currentValue = await this.getValue();
    if (currentValue !== value) {
      await this.toggle();
    }
  }
}
