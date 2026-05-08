import appHelper from '../helpers/app-helper';
import { Switch } from './switch';

export class SwitchSection<T extends Record<string, string>> {
  constructor(
    private labelToKey: T,
    private getLocatorByKey: (key: T[keyof T]) => string,
  ) {}

  async getByKey(key: T[keyof T]): Promise<Switch> {
    const locator = this.getLocatorByKey(key);
    const el = await $(`~${locator}`);

    await appHelper.swipeUpToReveal(el as unknown as WebdriverIO.Element);

    return new Switch(locator);
  }

  async getByLabel(label: keyof T): Promise<Switch> {
    const key = this.labelToKey[label];
    if (!key) {
      throw new Error(`Switch with label "${String(label)}" not found.`);
    }
    return this.getByKey(key);
  }

  async toggleByLabel(label: keyof T) {
    const switchEl = await this.getByLabel(label);
    await switchEl.toggle();
  }

  async setValueByLabel(label: keyof T, value: boolean) {
    const switchEl = await this.getByLabel(label);
    await switchEl.setValue(value);
  }

  async getValueByLabel(label: keyof T): Promise<boolean> {
    const switchEl = await this.getByLabel(label);
    return await switchEl.getValue();
  }
}
