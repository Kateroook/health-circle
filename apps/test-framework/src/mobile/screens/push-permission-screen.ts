import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class PushPermissionScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.pushPermission}`, 'PushPermissionScreen');
  }

  get skipLocationButton() {
    return $('~auth:skipLocation:button');
  }

  get allowLocationButton() {
    return $('~auth:allowLocation:button');
  }

  get skipPushButton() {
    return $('~auth:skipPush:button');
  }

  get allowPushButton() {
    return $('~auth:allowPush:button');
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
    return $(`~auth:avatar:${avatarId}:button`);
  }

  async selectRandomAvatar() {
    const AVATAR_IDS = ['cool', 'duckling', 'chillguy', 'headphones', 'sleepy', 'scarf', 'hungry', 'summer'] as const;

    const randomIndex = Math.floor(Math.random() * AVATAR_IDS.length);
    const randomId = AVATAR_IDS[randomIndex];

    const avatar = await this.getAvatarById(randomId);
    await avatar.waitForDisplayed({ timeout: 5000 });
    await avatar.click();

    return randomId;
  }

  async clickSkipLocationButton() {
    await this.tap(this.skipLocationButton);
  }

  async clickAllowLocationButton() {
    await this.tap(this.allowLocationButton);
  }

  async clickSkipPushButton() {
    await this.tap(this.skipPushButton);
  }

  async clickAllowPushButton() {
    await this.tap(this.allowPushButton);
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

export default new PushPermissionScreen();
