import { STATUSES } from '@core/data/constants';
import { GroupFactory } from '@core/data/factories/group-factory';
import { GroupEntity } from '@core/types/entites/group-interface';
import DashboardScreen from 'src/mobile/screens/dashboard-screen';
import { utils } from 'src/utils/utils';
import { timeout } from 'src/utils/wait-helper';
import LoginScreen from '../../screens/login-screen';

describe('Main page', () => {
  it('[HC-65] Quick and long button press', async () => {
    const user = await browser.backend.spawnUser();
    await LoginScreen.openDirectly();
    await LoginScreen.login({ identifier: user.email, password: user.password });
    await DashboardScreen.waitForIsShown();

    await DashboardScreen.quickClickStatusButton();
    await DashboardScreen.confirmSafetyModal.confirm();

    const statusLabel = await DashboardScreen.mainStatusButtonText;
    expect(statusLabel).toHaveText(STATUSES.SAFE.label, { wait: timeout.short });

    await DashboardScreen.longClickStatusButton();
    await DashboardScreen.confirmDangerModal.confirm();

    expect(statusLabel).toHaveText(STATUSES.DANGER.label, { wait: timeout.short });
  });

  it('[HC-62] Displaying all members of all circles or one circle', async () => {
    const user = await browser.backend.spawnUser();
    await browser.backend.api.auth.login({ identifier: user.email, password: user.password });

    const groups: GroupEntity[] = [];

    for (let g = 0; g < 2; g++) {
      const group = GroupFactory.createGroupWithSpecificOwner(user);
      const groupResponse = await browser.backend.api.groups.createGroup({
        name: group.name,
      });
      group.id = groupResponse.data.id;
      group.inviteCode = groupResponse.data.inviteCode;

      const memberApi = await browser.backend.spawnApi();
      for (let i = 0; i < 2; i++) {
        const newMember = await browser.backend.spawnUser();
        await memberApi.auth.login({ identifier: newMember.email, password: newMember.password });
        await memberApi.groups.joinGroup({ code: group.inviteCode });
        group.members.push(newMember);
      }
      groups.push(group);
    }

    await LoginScreen.openDirectly();
    await LoginScreen.login({ identifier: user.email, password: user.password });
    await DashboardScreen.waitForIsShown();

    for (const group of groups) {
      await DashboardScreen.selectGroup(group.id!);

      for (const member of group.members) {
        if (member.id === user.id) continue;

        const memberCard = await DashboardScreen.getMemberCard(member.id!);
        await memberCard.scrollIntoView();
        await expect(memberCard).toBeDisplayed();
      }
    }
  });

  it('[HC-61] The status ring and the status icon correspond to the current status of the user', async () => {
    const user = await browser.backend.spawnUser();
    const displayedUser = await browser.backend.spawnUser();
    const displayedUserApi = await browser.backend.spawnApi();

    await displayedUserApi.auth.login({ identifier: displayedUser.email, password: displayedUser.password });
    const groupResponse = await displayedUserApi.groups.createGroup({ name: utils.random.string() });
    const group = groupResponse.data;
    await displayedUserApi.groups.joinGroup({ code: group.inviteCode });

    const mainUserApi = await browser.backend.spawnApi();
    await mainUserApi.auth.login({ identifier: user.email, password: user.password });
    await mainUserApi.groups.joinGroup({ code: group.inviteCode });

    await LoginScreen.openDirectly();
    await LoginScreen.login({ identifier: user.email, password: user.password });
    await DashboardScreen.waitForIsShown();

    for (const status of Object.values(STATUSES)) {
      await displayedUserApi.users.updateUserStatus({ status: status.name as any });

      const memberCard = await DashboardScreen.getMemberCard(displayedUser.id!);
      await memberCard.scrollIntoView();

      const badge = await DashboardScreen.getMemberStatusBadge(displayedUser.id!, status.name);
      await badge.waitForDisplayed({ timeout: timeout.extraLong * 3, interval: timeout.short });
      await expect(badge).toBeDisplayed();

      const statusText = await DashboardScreen.getMemberStatusLabel(displayedUser.id!);
      await statusText.waitForDisplayed({ timeout: timeout.extraLong * 3, interval: timeout.short });
      const currentText = await statusText.getText();
      expect(currentText).toBe(status.label);
    }
  });
});
