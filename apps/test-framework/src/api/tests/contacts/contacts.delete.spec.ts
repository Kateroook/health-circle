import { expect, test } from '../../fixtures/api-fixture';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { ApiClientFactory } from '../../../core/api/api-client-factory';
import crypto from 'crypto';

test.describe('/api/contacts delete tests', async () => {
  let userA: UserEntity;
  let userB: UserEntity;
  let secondApi: ApiClientFactory;
  let contactListID: string;

  test.beforeEach(
    'Setup User A and User B and add User B to contacts of User A',
    async ({ api, spawnUser, spawnApi }) => {
      userA = await spawnUser();
      await api.auth.login({
        identifier: userA.email,
        password: userA.password,
      });

      userB = await spawnUser();
      secondApi = await spawnApi();
      await secondApi.auth.login({
        identifier: userB.email,
        password: userB.password,
      });

      const createResult = await api.contacts.createContact({
        target: { id: userB.id! },
        alias: userB.firstName + ' ' + userB.lastName,
      });
      contactListID = createResult.data.id;
    },
  );

  test('[CNT-020] Successful delete contact', async ({ api }) => {
    const deleteResult = await api.contacts.deleteContact(userB.id!);

    expect(deleteResult.response).toHaveStatus(200);
  });

  test("[CNT-021] Contact is absent in user's list after delete", async ({ api, contactRepository }) => {
    await api.contacts.deleteContact(userB.id!);
    const getContactById = await api.contacts.findContactByTargetId(userB.id!);
    const apiGetContact = await api.contacts.getAllContacts();

    expect(getContactById).toBeNull();
    expect(apiGetContact.data).toHaveLength(0);

    const contactRowDB = await contactRepository.findBy({ id: contactListID });
    expect(contactRowDB).toHaveLength(0);
  });

  test("[CNT-022] Delete contact two times from user's contact list", async ({ api }) => {
    await api.contacts.deleteContact(userB.id!);
    const deleteResult = await api.contacts.deleteContact(userB.id!);

    expect(deleteResult.response).toHaveStatus(404);
  });

  test('[CNT-023] Delete contact with non-existing target ID', async ({ api }) => {
    const deleteResult = await api.contacts.deleteContact(crypto.randomUUID());

    expect(deleteResult.response).toHaveStatus(404);
  });

  test('[CNT-024] Delete contact without authorization', async ({ api }) => {
    api.contacts.clearTokens();
    const deleteResult = await api.contacts.deleteContact(userB.id!);

    expect(deleteResult.response).toHaveStatus(401);
  });
});
