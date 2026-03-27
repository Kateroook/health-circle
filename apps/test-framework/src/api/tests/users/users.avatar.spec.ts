import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test('[USR-056] Avatar uploading in PNG format ', async ({ api, spawnUser, userRepository }) => {
  const user = await spawnUser();
  await api.auth.quickLogin(user.email, user.password);
  const avatar = utils.random.avatar('.png');

  const userWithAvatar = await api.users.uploadUserAvatar(user.id!, avatar.buffer);
  await expect(userWithAvatar.response).toHaveStatus(200);
  expect(userWithAvatar.data.id).toBe(user.id);
  expect(userWithAvatar.data.firstName).toBe(user.firstName);
  expect(userWithAvatar.data.lastName).toBe(user.lastName);
  expect(userWithAvatar.data.middleName).toBe(user.middleName);
  expect(userWithAvatar.data.email).toBe(user.email);
  expect(userWithAvatar.data.phone).toBe(user.phone);
  expect(userWithAvatar.data.avatarUpdatedAt).toBeDefined();
});
