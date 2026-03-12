import { expect } from '@playwright/test';
import { test } from '../fixtures/api-fixture';
import { UserFactory } from '../../core/data/factories/user-factory';
import { assertResponse, checkResponse } from '../../core/api/helpers/response-checker';

//PASS
test('post user with non-ukrainian phone number', async ({ api }) => {
  let user = UserFactory.createUserForTest({testId: 'PhoneTest'});
  const postUser = await api.users.createUser({
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
  });

  console.log(postUser.response);
  console.log(await postUser.response.json());

  assertResponse.is2xx(postUser.response);
});

//PASS
test('post user with no middlename phone number', async ({ api }) => {
  let user = UserFactory.createRandomUser(); //no middlename as default
  const postUser = await api.users.createUser({
    email: user.email,
    phone: '+380691033014',
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
  });

  console.log(postUser.response);
  console.log(await postUser.response.json());

  assertResponse.is2xx(postUser.response);
});

//PASS
test('Create new user and delete him', async ({ api, confirmationCodeRepository }) => {
  let newUser = UserFactory.createUserForTest({testId: 'middleNameTest'});
  console.log(newUser);

  newUser.phone = '+380691233014';

  const postUser = await api.users.createUser({
    email: newUser.email,
    phone: newUser.phone,
    firstName: newUser.firstName,
    middleName: newUser.middleName,
    lastName: newUser.lastName,
  });
  console.log(postUser.response);
  console.log(await postUser.response.json());

  assertResponse.is2xx(postUser.response);
  newUser.id = postUser.data.id;

  const code = (await confirmationCodeRepository.findBy({ userId: newUser.id }))[0];

  await api.auth.setupPassword(newUser.email!, code.code, {
    newPassword: newUser.password,
    confirmNewPassword: newUser.password,
  });

  await api.auth.login({
    identifier: newUser.email!,
    password: newUser.password,
  });

  const profile = (await api.auth.getProfile()).data;

  expect(newUser).toEqual(
    expect.objectContaining({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
    }),
  );
});
