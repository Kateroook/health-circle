import DashboardScreen from 'src/mobile/screens/dashboard-screen';
import { utils } from 'src/utils/utils';
import { UserStatus } from '../../../../../core-api/src/common/enums/user-status';
import LoginScreen from '../../screens/login-screen';

describe('Main page', () => {
  const STATUSES = [
    { name: UserStatus.SAFE, label: 'В безпеці' },
    { name: UserStatus.DANGER, label: 'Потрібна допомога!' },
    { name: UserStatus.UNKNOWN, label: 'Невідомо' },
    { name: UserStatus.WAS_SAFE, label: 'Був у безпеці' },
  ] as const;

  it('[HC-65] Quick and long button press', async () => {
    const user = await browser.backend.spawnUser();
    await LoginScreen.openDirectly();
    await LoginScreen.login({ identifier: user.email, password: user.password });
    await DashboardScreen.waitForIsShown();

    await DashboardScreen.quickClickStatusButton();
    await DashboardScreen.safeStatusDialog.waitForIsShown();
    await DashboardScreen.safeStatusDialog.clickConfirmSafeStatusButton();

    const statusTextSafe = await DashboardScreen.statusButton.$(
      `android=new UiSelector().text("${STATUSES[0].label}")`,
    );
    await statusTextSafe.waitForDisplayed({ timeout: 5000 });
    await expect(statusTextSafe).toBeDisplayed();

    await DashboardScreen.longClickStatusButton();
    await DashboardScreen.dangerStatusDialog.waitForIsShown();
    await DashboardScreen.dangerStatusDialog.clickConfirmDangerStatusButton();

    const statusTextDanger = await DashboardScreen.statusButton.$(
      `android=new UiSelector().text("${STATUSES[1].label}")`,
    );
    await statusTextDanger.waitForDisplayed({ timeout: 5000 });
    await expect(statusTextDanger).toBeDisplayed();
  });

  it('[HC-62] Displaying all members of all circles or one circle', async () => {
    const user = await browser.backend.spawnUser();
    await browser.backend.api.auth.login({ identifier: user.email, password: user.password });

    const groups: any[] = [];
    const membersByGroup: Record<string, any[]> = {};

    for (let g = 0; g < 2; g++) {
      const groupResponse = await browser.backend.api.groups.createGroup({ name: utils.random.string() });
      const currentGroup = groupResponse.data;
      groups.push(currentGroup);
      membersByGroup[currentGroup.id] = [];

      for (let i = 0; i < 4; i++) {
        const newMember = await browser.backend.spawnUser();
        const memberApi = await browser.backend.spawnApi();
        await memberApi.auth.login({ identifier: newMember.email, password: newMember.password });
        await memberApi.groups.joinGroup({ code: currentGroup.inviteCode });
        membersByGroup[currentGroup.id].push(newMember);
      }
    }

    await LoginScreen.openDirectly();
    await LoginScreen.login({ identifier: user.email, password: user.password });
    await DashboardScreen.waitForIsShown();

    for (const group of groups) {
      const groupFilter = await DashboardScreen.getGroupFilterButton(group.id);
      await groupFilter.waitForDisplayed({ timeout: 5000 });
      await groupFilter.click();
      await browser.pause(1000);

      for (const member of membersByGroup[group.id]) {
        const memberCard = await DashboardScreen.getMemberCard(member.id);
        await memberCard.scrollIntoView();
        await expect(memberCard).toBeDisplayed();
      }
    }
  });

  it('[HC-61] The status ring and the status icon correspond to the current status of the user', async () => {
    const user = await browser.backend.spawnUser();
    const userA = await browser.backend.spawnUser();
    const userAApi = await browser.backend.spawnApi();

    await userAApi.auth.login({ identifier: userA.email, password: userA.password });
    const groupResponse = await userAApi.groups.createGroup({ name: utils.random.string() });
    const group = groupResponse.data;
    await userAApi.groups.joinGroup({ code: group.inviteCode });

    const mainUserApi = await browser.backend.spawnApi();
    await mainUserApi.auth.login({ identifier: user.email, password: user.password });
    await mainUserApi.groups.joinGroup({ code: group.inviteCode });

    await LoginScreen.openDirectly();
    await LoginScreen.login({ identifier: user.email, password: user.password });
    await DashboardScreen.waitForIsShown();

    for (const status of STATUSES) {
      await userAApi.users.updateUserStatus({ status: status.name as any });
      await browser.pause(3000);

      const badge = await DashboardScreen.getMemberStatusBadge(userA.id!, status.name);
      await badge.waitForDisplayed({ timeout: 5000 });
      await expect(badge).toBeDisplayed();

      const memberCard = await DashboardScreen.getMemberCard(userA.id!);
      const statusText = await memberCard.$(`android=new UiSelector().text("${status.label}")`);
      await expect(statusText).toBeDisplayed();
    }
  });
});
