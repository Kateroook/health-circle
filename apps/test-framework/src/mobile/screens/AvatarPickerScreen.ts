import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class AvatarPickerScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.avatarPicker}`, 'AvatarPicker');
  }
}

export default new AvatarPickerScreen();
