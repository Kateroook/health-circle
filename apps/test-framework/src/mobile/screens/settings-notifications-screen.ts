import { ScreenIds } from '../../../../client/src/utils/testIDs';
import { SwitchSection } from '../components/switch-section';
import BaseScreen from './base-screen';

const LABEL_TO_SWITCH_KEY = {
  'Push-сповіщення': 'enabled',
  'Отримувати сповіщення, коли у вашому регіоні повітряна тривога': 'airAlerts',
  'Отримувати сповіщення про статус членів Кола': 'statusUpdates',
  'Отримувати сповіщення, коли у когось стан залишається “Невідомо” під час тривоги': 'unknownStatusAlerts',
  'Нагадувати оновити статус під час тривоги': 'statusUpdateReminders',
  'Отримувати SMS лише тоді, коли немає інтернету, але є важливе сповіщення.': 'smsFallover',
  'SMS для статусу безпеки': 'smsSafetyStatus',
} as const;

class SettingsNotificationsScreen extends BaseScreen {
  public switches: SwitchSection<typeof LABEL_TO_SWITCH_KEY>;

  constructor() {
    super(`~${ScreenIds.settingsNotifications}`, 'Settings Notifications');
    this.switches = new SwitchSection(LABEL_TO_SWITCH_KEY, (key: string) => `notifications:${key}:switch`);
  }

  get backButton() {
    return $('~notifications:back:button');
  }

  async goBack() {
    await this.backButton.click();
  }
}

export default new SettingsNotificationsScreen();
