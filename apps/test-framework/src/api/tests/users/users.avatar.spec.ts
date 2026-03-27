import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test('[USR-056] Avatar uploading in PNG format ', async ({ api, spawnUser, userRepository }) => {
  const user = await spawnUser();
  await api.auth.quickLogin(user.email, user.password);
  const avatar = utils.random.avatar('.png');

  const userWIthAvatar = await api.users.uploadUserAvatar(user.id!, avatar.buffer);
  await expect(userWIthAvatar.response).toHaveStatus(200);
  expect(userWIthAvatar.data.id).toBe(user.id);
  expect(userWIthAvatar.data.firstName).toBe(user.firstName);
  expect(userWIthAvatar.data.lastName).toBe(user.lastName);
  expect(userWIthAvatar.data.middleName).toBe(user.middleName);
  expect(userWIthAvatar.data.email).toBe(user.email);
  expect(userWIthAvatar.data.phone).toBe(user.phone);
  expect(userWIthAvatar.data.avatarUpdatedAt).toBeDefined();
});
