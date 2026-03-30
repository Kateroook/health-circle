import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('User Avatar Management', () => {
  let user: any;

  test.beforeEach(async ({ api, spawnUser }) => {
    user = await spawnUser();
    await api.auth.quickLogin(user.email, user.password);
  });
  test('[USR-056] Avatar uploading in PNG format ', async ({ api }) => {
    const avatar = utils.random.avatar('.png');
    const userWithAvatar = await api.users.uploadUserAvatar(user.id!, avatar.buffer);
    expect(userWithAvatar.response).toHaveStatus(200);
    expect(userWithAvatar.data).toMatchObject({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      email: user.email,
      phone: user.phone,
    });
  });

  test('[USR-057] Avatar uploading in JPEG format ', async ({ api }) => {
    const avatar = utils.random.avatar('.jpeg');
    const userWithAvatar = await api.users.uploadUserAvatar(user.id!, avatar.buffer);
    expect(userWithAvatar.response).toHaveStatus(200);
    expect(userWithAvatar.data).toMatchObject({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      email: user.email,
      phone: user.phone,
    });
  });

  test('[USR-058] Getting an avatar after uploading ', async ({ api }) => {
    const avatarFormat = utils.random.pick(['.png', '.jpg', '.jpeg'] as const);
    const avatar = utils.random.avatar(avatarFormat);
    const userWithAvatar = await api.users.uploadUserAvatar(user.id!, avatar.buffer);
    await expect(userWithAvatar.response).toHaveStatus(200);
    const uploadedAvatar = await api.users.getUserAvatar(user.id!);
    expect(uploadedAvatar.response).toHaveStatus(200);
    const contentType = uploadedAvatar.response.headers()['content-type'];
    expect(contentType).toContain(avatar.mimeType);
    expect(uploadedAvatar.data).toEqual(avatar.buffer);
  });

  test('[USR-059] Avatar deletion ', async ({ api }) => {
    const avatar = utils.random.avatar(utils.random.pick(['.png', '.jpg', '.jpeg']));
    const userWithAvatar = await api.users.uploadUserAvatar(user.id!, avatar.buffer);
    expect(userWithAvatar.response).toHaveStatus(200);
    const deletedAvatar = await api.users.deleteUserAvatar(user.id!);
    expect(deletedAvatar.response).toHaveStatus(204);
  });

  test('[USR-060] Getting avatar after deletion', async ({ api }) => {
    const avatar = utils.random.avatar(utils.random.pick(['.png', '.jpg', '.jpeg']));
    const userWithAvatar = await api.users.uploadUserAvatar(user.id!, avatar.buffer);
    expect(userWithAvatar.response).toHaveStatus(200);
    await api.users.deleteUserAvatar(user.id!);
    const avatarAfterDeletion = await api.users.getUserAvatar(user.id!);
    expect(avatarAfterDeletion.response).toHaveStatus(404);
  });

  test('[USR-061] Avatar uploading for someone else`s id ', async ({ api, spawnUser }) => {
    const userB = await spawnUser();
    const avatar = utils.random.avatar(utils.random.pick(['.png', '.jpg', '.jpeg']));
    const userWithAvatar = await api.users.uploadUserAvatar(userB.id!, avatar.buffer);
    expect(userWithAvatar.response).toHaveStatus4xx;
  });

  test('[USR-062] Avatar uploading without authorization', async ({ api }) => {
    api.auth.clearTokens();
    const avatar = utils.random.avatar(utils.random.pick(['.png', '.jpg', '.jpeg']));
    const userWithAvatar = await api.users.uploadUserAvatar(user.id!, avatar.buffer);
    expect(userWithAvatar.response).toHaveStatus(401);
  });
});
