import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';
import { Switch } from '../components/switch';

const LABEL_TO_SWITCH_KEY: Record<string, string> = {
  'Push-сповіщення': 'enabled',
  'Отримувати сповіщення, коли у вашому регіоні повітряна тривога': 'airAlerts',
  'Отримувати сповіщення про статус членів Кола': 'statusUpdates',
  'Отримувати сповіщення, коли у когось стан залишається “Невідомо” під час тривоги': 'unknownStatusAlerts',
  'Нагадувати оновити статус під час тривоги': 'statusUpdateReminders',
  'Отримувати SMS лише тоді, коли немає інтернету, але є важливе сповіщення.': 'smsFallover',
  'SMS для статусу безпеки': 'smsSafetyStatus',
};

class SettingsNotificationsScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.settingsNotifications}`, 'Settings Notifications');
  }

  getSwitchByKey(key: string): Switch {
    return new Switch(`notifications:${key}:switch`);
  }

  getSwitchByLabel(label: string): Switch {
    const key = LABEL_TO_SWITCH_KEY[label];
    if (!key) {
      throw new Error(`Switch with label "${label}" not found.`);
    }
    return this.getSwitchByKey(key);
  }

  async setToggleValueByLabel(label: string, value: boolean) {
    const toggle = this.getSwitchByLabel(label);
    await toggle.setValue(value);
  }

  async getToggleValueByLabel(label: string): Promise<boolean> {
    const toggle = this.getSwitchByLabel(label);
    return await toggle.getValue();
  }
}

export default new SettingsNotificationsScreen();
