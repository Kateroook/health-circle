import { expect } from '../fixtures/api-fixture';
import { test } from '../fixtures/api-fixture';
import { UserFactory } from '../../core/data/factories/user-factory';
import { utils } from '../../utils/utils';

test.describe('New user example tests', async () => {
  test.skip('post user with non-ukrainian phone number', async ({ api }) => {
    let user = UserFactory.createUserForTest({
      testId: 'PhoneTest',
      overrides: {
        phone: utils.random.phone('us'),
      },
    });
    const postUser = await api.users.createUser({
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
    });

    console.log(postUser.response);
    console.log(await postUser.response.json());

    expect(postUser.response).toHaveStatus2xx();
  });

  test.skip('post user with no middlename and ukrainian phone number', async ({ api }) => {
    let user = UserFactory.createRandomUser({
      phone: utils.random.phone('ua'),
    }); //no middlename as default
    const postUser = await api.users.createUser({
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
    });

    console.log(postUser.response);
    console.log(await postUser.response.json());

    expect(postUser.response).toHaveStatus2xx();
  });

  //PASS
  test.skip('Create new user and delete him', async ({ api, confirmationCodeRepository }) => {
    let newUser = UserFactory.createUserForTest({
      testId: 'middleNameTest',
      overrides: {
        phone: utils.random.phone('ua'),
      },
    });
    console.log(newUser);

    const postUser = await api.users.createUser({
      email: newUser.email,
      phone: newUser.phone,
      firstName: newUser.firstName,
      middleName: newUser.middleName,
      lastName: newUser.lastName,
    });
    console.log(postUser.response);
    console.log(await postUser.response.json());

    expect(postUser.response).toHaveStatus2xx();
    newUser.id = postUser.data.id;

    const code = await confirmationCodeRepository.getLastUserCode(newUser.id);

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

  test.fixme('post user with funny password', async ({ api, confirmationCodeRepository }) => {
    let user = UserFactory.createRandomUser({
      password: utils.random.pick<string>(['o__________O', 'o__________0', 'O__________0']),
    }); //no middlename as default
    const postUser = await api.users.createUser({
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
    });
    user.id = postUser.data.id;

    expect(postUser.response).toHaveStatus2xx();
    const code = await confirmationCodeRepository.getLastUserCode(user.id);
    const setupPassword = await api.auth.setupPassword(user.email, code.code, {
      newPassword: user.password,
      confirmNewPassword: user.password,
    });

    console.log(setupPassword.response);
    expect(setupPassword.response).toHaveStatus4xx();
  });
});
