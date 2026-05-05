import { ComponentsIds, ScreenIds } from '../../../../client/src/utils/testIDs';
import { DangerStatusDialog } from '../components/popUp-components/in-danger-status-popUp';
import { SafeStatusDialog } from '../components/popUp-components/in-safe-status-popUp';
import BaseScreen from './base-screen';

class DashboardScreen extends BaseScreen {
  public safeStatusDialog: SafeStatusDialog;
  public dangerStatusDialog: DangerStatusDialog;
  constructor() {
    super(`~${ScreenIds.dashboard}`, 'Dashboard');
    this.safeStatusDialog = new SafeStatusDialog(ComponentsIds.inSafeStatusPopUp);
    this.dangerStatusDialog = new DangerStatusDialog(ComponentsIds.inDangerStatusPopUp);
  }

  get statusButton() {
    return $('~dashboard:mainStatus:button');
  }

  get allButton() {
    return $('~dashboard:filter_all:button');
  }

  get buttonStatusLabel() {
    return $('~dashboard:mainStatus:button:text');
  }

  get greetingLabel() {
    return $('~dashboard:header:greeting');
  }

  get mainStatusButtonText() {
    return $('~dashboard:mainStatus:button:text');
  }

  async getGreetingText() {
    return await this.greetingLabel.getText();
  }

  getGroupFilterButton(groupId: string) {
    return $(`~dashboard:filter_${groupId}:button`);
  }

  getMemberCard(memberId: string) {
    return $(`~dashboard:member_${memberId}:button`);
  }

  getMemberStatusBadge(userId: string, status: string) {
    return $(`~dashboard:member_${userId}:button:badge:${status}`);
  }

  async quickClickStatusButton() {
    await this.tap(this.statusButton);
  }

  async longClickStatusButton() {
    await (await this.statusButton).click({ duration: 2000 });
  }

  async clickAllButton() {
    await this.tap(this.allButton);
  }
}

export default new DashboardScreen();
