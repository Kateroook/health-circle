import { ScreenIds } from '../../../../client/src/utils/testIDs';
import { utils } from '../../utils/utils';
import BaseScreen from './base-screen';

class AvatarPickerScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.avatarPicker}`, 'AvatarPicker');
  }

  get skipAvatarButton() {
    return $('~auth:skipAvatar:button');
  }

  get uploadAvatarWrapper() {
    return $('~auth:avatar:upload_wrapper');
  }

  get nextButton() {
    return $('~auth:next:button');
  }

  async getAvatarById(avatarId: string) {
    return $(`android=new UiSelector().resourceId("auth:avatar:${avatarId}:button")`);
  }

  async selectRandomAvatar() {
    const AVATAR_IDS = ['cool', 'duckling', 'chillguy', 'headphones', 'sleepy', 'scarf', 'hungry', 'summer'];

    const randomId = utils.random.pick(AVATAR_IDS);

    const avatar = await this.getAvatarById(randomId);
    await avatar.waitForDisplayed({ timeout: 5000 });
    await avatar.click();

    return randomId;
  }

  async clickSkipAvatarButton() {
    await this.tap(this.skipAvatarButton);
  }

  async clickUploadAvatarWrapper() {
    await this.tap(this.uploadAvatarWrapper);
  }

  async clickNextButton() {
    await this.tap(this.nextButton);
  }
}

export default new AvatarPickerScreen();
