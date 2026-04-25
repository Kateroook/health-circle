import { ComponentsIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from '../screens/base-screen';

class userModal extends BaseScreen {
  constructor() {
    super(`~${ComponentsIds.userModal}`, 'userModal');
  }

  get rollCallButton() {
    return $('~profile:rollCall:button');
  }
  get confirmRollCallButton() {
    return $('~profile:confirmRollCall:modal:confirm:button');
  }
  get cancelRollCallButton() {
    return $('~profile:confirmRollCall:modal:cancel:button');
  }
  get copyLocationButton() {
    return $('~profile:copyLocation:button');
  }

  get copyLocationIcon() {
    return $('~profile:copyLocation:copy:icon');
  }

  get copySuccessIcon() {
    return $('~profile:copyLocation:success:icon');
  }
  get contactButton() {
    return $('~profile:contact:button');
  }
  get renameButton() {
    return $('~profile:rename:button');
  }
  get blockButton() {
    return $('~profile:block:button');
  }
  get removeButton() {
    return $('~profile:remove:button');
  }

  async clickRollCallButton() {
    await this.tap(this.rollCallButton);
  }

  async clickCopyLocationButton() {
    await this.tap(this.copyLocationButton);
  }

  async clickContactButton() {
    await this.tap(this.contactButton);
  }

  async clickRenameButton() {
    await this.tap(this.renameButton);
  }

  async clickBlockButton() {
    await this.tap(this.blockButton);
  }
  async clickRemoveButton() {
    await this.tap(this.removeButton);
  }
}
