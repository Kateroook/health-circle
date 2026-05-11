import { ComponentsIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from '../screens/base-screen';

class userList extends BaseScreen {
  constructor() {
    super(`~${ComponentsIds.userList}`, 'userList');
  }

  userItem(testId: string) {
    return $(`~${testId}`);
  }

  userLabel(testId: string) {
    return $(`~${testId}:label`);
  }

  userSubLabel(testId: string) {
    return $(`~${testId}:subLabel`);
  }

  userSupportCaption(testId: string) {
    return $(`~${testId}:supportCaption`);
  }

  userStatusBadge(testId: string, status: string) {
    return $(`~${testId}:badge:${status}`);
  }

  async clickUser(testId: string) {
    await this.tap(this.userItem(testId));
  }

  async getUserName(testId: string) {
    return await this.userLabel(testId).getText();
  }

  async getUserStatusText(testId: string) {
    return await this.userSubLabel(testId).getText();
  }

  async getUserSupportInfo(testId: string) {
    return await this.userSupportCaption(testId).getText();
  }
}
