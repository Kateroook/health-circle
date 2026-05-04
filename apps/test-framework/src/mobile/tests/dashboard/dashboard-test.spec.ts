import DashboardScreen from 'src/mobile/screens/dashboard-screen';
import { utils } from 'src/utils/utils';
import LoginScreen from '../../screens/login-screen';

describe('Main page', () => {
  it('[HC-65] Quick and long button press', async () => {
    const user = await browser.backend.spawnUser();
    await LoginScreen.openDirectly();
    await LoginScreen.login({
      identifier: user.email,
      password: user.password,
    });
    await LoginScreen.openDirectly();
    await DashboardScreen.waitForIsShown();
    await DashboardScreen.quickClickStatusButton();
    await DashboardScreen.safeStatusDialog.waitForIsShown();
    await DashboardScreen.safeStatusDialog.clickConfirmSafeStatusButton();
    await browser.pause(2000);
    const userDbRow1 = (await browser.backend.userRepository.findBy({ id: user.id }))[0];
    console.log(userDbRow1.status);

    await DashboardScreen.longClickStatusButton();
    await DashboardScreen.dangerStatusDialog.waitForIsShown();
    await DashboardScreen.dangerStatusDialog.clickConfirmDangerStatusButton();
    await browser.pause(2000);
    const userDbRow2 = (await browser.backend.userRepository.findBy({ id: user.id }))[0];
    console.log(userDbRow2.status);
  });

  let groups: any[] = [];
  let owner: any;

  it('[HC-62] Displaying all members of all circles or one circle', async () => {
    owner = await browser.backend.spawnUser();

    await browser.backend.api.auth.login({
      identifier: owner.email,
      password: owner.password,
    });

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
    await LoginScreen.login({ identifier: owner.email, password: owner.password });

    await DashboardScreen.waitForIsShown();

    for (const group of groups) {
      const groupFilter = await DashboardScreen.getGroupFilterButton(group.id);
      await groupFilter.click();
      await browser.pause(1000);

      const expectedMembers = membersByGroup[group.id];
      for (const member of expectedMembers) {
        const memberCard = await DashboardScreen.getMemberCard(member.id);
        await memberCard.scrollIntoView();
        await memberCard.waitForDisplayed({ timeout: 5000 });
        console.log(`Member ${member.firstName} displays correctly`);
      }
    }

    await DashboardScreen.clickAllButton();
    await browser.pause(1000);

    const totalMembersCount = Object.values(membersByGroup).flat().length;
    console.log(`Total amount of members in all circles: ${totalMembersCount}`);
  });

  it('[HC-61] The status ring and the status icon correspond to the current status of the user', async () => {});
});
