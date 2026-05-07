import { ComponentsIds, ScreenIds } from '../../../../client/src/utils/testIDs';
import { ConfirmationModal } from '../components/confirmationModal';
import BaseScreen from './base-screen';

class DashboardScreen extends BaseScreen {
  public confirmSafetyModal: ConfirmationModal;
  public confirmDangerModal: ConfirmationModal;
  constructor() {
    super(`~${ScreenIds.dashboard}`, 'Dashboard');
    this.confirmSafetyModal = new ConfirmationModal(ComponentsIds.inSafetyStatusModal);
    this.confirmDangerModal = new ConfirmationModal(ComponentsIds.inDangerStatusModal);
  }

  get statusButton() {
    return $('~dashboard:mainStatus:button');
  }

  get filtersContainer() {
    return $('~dashboard:filters:container');
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

  getMemberStatusLabel(userId: string) {
    return $(`~dashboard:member_${userId}:button:subLabel`);
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

  async selectGroup(groupId: string, direction: 'left' | 'right' = 'left') {
    const groupFilter = await this.getGroupFilterButton(groupId);
    await groupFilter.scrollIntoView({
      direction: direction,
      maxScrolls: 10,
      scrollableElement: this.filtersContainer,
    });
    await groupFilter.waitForDisplayed({ timeout: 5000 });
    await groupFilter.click();
  }
}

export default new DashboardScreen();
