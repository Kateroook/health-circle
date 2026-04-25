import { ComponentsIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from '../screens/base-screen';

class newCircleModal extends BaseScreen {
  constructor() {
    super(`~${ComponentsIds.newCircleModal}`, 'newCircleModal');
  }

  get joinTab() {
    return $('~circle:join:tab');
  }
  get createTab() {
    return $('~circle:create:tab');
  }

  get joinCodeInput() {
    return $('~circle:joinCode:input');
  }
  get circleNameInput() {
    return $('~circle:name:input');
  }
  get generatedCodeInput() {
    return $('~circle:generatedCode:input');
  }

  get joinButton() {
    return $('~circle:join:button');
  }
  get createButton() {
    return $('~circle:create:button');
  }
  get submitButton() {
    return $('~circle:submit:button');
  }
  get copyCodeButton() {
    return $('~circle:copyCode:button');
  }
  get shareInviteButton() {
    return $('~circle:shareInvite:button');
  }

  get creatingLoader() {
    return $('~circle:create:loader');
  }
  get successImage() {
    return $('~circle:success:image');
  }

  async clickJoinTab() {
    await this.tap(this.joinTab);
  }

  async clickCreateTab() {
    await this.tap(this.createTab);
  }
  async clickCreateButton() {
    await this.tap(this.createButton);
  }

  async clickJoinButton() {
    await this.tap(this.joinButton);
  }

  async clickCopyButton() {
    await this.tap(this.copyCodeButton);
  }

  async clickShareInviteButton() {
    await this.tap(this.shareInviteButton);
  }

  async clickSubmitButton() {
    await this.tap(this.submitButton);
  }

  async fillJoinCode(joinCode?: string) {
    await this.wait(this.joinCodeInput);
    if (joinCode) {
      await this.joinCodeInput.setValue(joinCode);
    }
  }

  async fillCircleName(circleName?: string) {
    await this.wait(this.circleNameInput);
    if (circleName) {
      await this.circleNameInput.setValue(circleName);
    }
  }

  async joinCircle(joinCode?: string) {
    await this.wait(this.joinCodeInput);
    if (joinCode) {
      await this.joinCodeInput.setValue(joinCode);
    }
    await this.clickJoinButton();
  }

  async createCircle(circleName?: string) {
    await this.fillCircleName(circleName);
    await this.clickCreateButton();
  }

  async getGeneratedCode() {
    await this.wait(this.generatedCodeInput);
    return await this.generatedCodeInput.getText();
  }
}
