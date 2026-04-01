import { UserFactory } from '../../../core/data/factories/user-factory';
import { ConfirmationCodeDbEntity } from '../../../core/types/db/codes-and-files';
import { UserEntity } from '../../../core/types/entites/user-interface';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';
test.describe(
  'api/auth/password-setup tests',
  {
    tag: '@auth',
  },
  async () => {
    let user: UserEntity;
    let confirmationCode: ConfirmationCodeDbEntity;
    test.beforeEach(async ({ api, confirmationCodeRepository }) => {
      user = UserFactory.createRandomUser();

      const postUser = await api.users.createUser({
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
      });

      expect(postUser.response).toHaveStatus2xx();
      user.id = postUser.data.id;

      confirmationCode = await confirmationCodeRepository.getLastUserCode(user.id);
    });

    test('[AUTH-018] Successful password setup after registration', async ({ api }) => {
      const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
        newPassword: user.password,
        confirmNewPassword: user.password,
      });

      expect(setupPassword.response).toHaveStatus2xx();

      const login = await api.auth.login({
        identifier: user.email,
        password: user.password,
      });
      expect(login.response).toHaveStatus2xx();
    });

    test('[AUTH-019] Wrong confirmation code for password setup', async ({ api }) => {
      const setupPassword = await api.auth.setupPassword(user.email!, '000000', {
        newPassword: user.password,
        confirmNewPassword: user.password,
      });

      expect(setupPassword.response).toHaveStatus4xx();

      const login = await api.auth.login({
        identifier: user.email,
        password: user.password,
      });
      expect(login.response).toHaveStatus4xx();
    });

    test("[AUTH-020] Passwords don't match in password setup", async ({ api }) => {
      const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
        newPassword: user.password,
        confirmNewPassword: user.password + '1',
      });

      expect(setupPassword.response).toHaveStatus4xx();

      const login = await api.auth.login({
        identifier: user.email,
        password: user.password,
      });
      expect(login.response).toHaveStatus4xx();
    });

    [
      {
        testName: '[AUTH-021] Passwords setup with short password',
        newPasword: utils.random.password(11),
      },
      {
        testName: '[AUTH-022] Passwords setup without uppercase letters',
        newPasword: utils.random.string({ length: 12, includeUpper: false }),
      },
      {
        testName: '[AUTH-023] Passwords setup without lowercase letters',
        newPasword: utils.random.string({ length: 12, includeLower: false }),
      },
      {
        testName: '[AUTH-024] Passwords setup without numbers',
        newPasword: utils.random.string({ length: 12, includeNumbers: false }),
      },
      {
        testName: '[AUTH-025] Passwords setup with password longer than 20 symbols',
        newPasword: utils.random.password(21),
      },
      {
        testName: '[AUTH-026] Passwords setup without special symbols',
        newPasword: utils.random.string({ length: 12, includeSpecial: false }),
      },
    ].forEach((options) =>
      test(options.testName, async ({ api }) => {
        user.password = options.newPasword;
        const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
          newPassword: user.password,
          confirmNewPassword: user.password,
        });

        expect(setupPassword.response).toHaveStatus4xx();

        const login = await api.auth.login({
          identifier: user.email,
          password: user.password,
        });
        expect(login.response).toHaveStatus4xx();
      }),
    );

    test('[AUTH-027] Passwords setup with the same code twice', async ({ api }) => {
      const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
        newPassword: user.password,
        confirmNewPassword: user.password,
      });

      expect(setupPassword.response).toHaveStatus2xx();

      const newPassword = utils.random.password();
      const repeatSetup = await api.auth.setupPassword(user.email!, confirmationCode.code, {
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      });

      expect(repeatSetup.response).toHaveStatus4xx();

      const loginWithNewPassword = await api.auth.login({
        identifier: user.email,
        password: newPassword,
      });
      expect(loginWithNewPassword.response).toHaveStatus4xx();

      const loginWithOldPassword = await api.auth.login({
        identifier: user.email,
        password: user.password,
      });
      expect(loginWithOldPassword.response).toHaveStatus2xx();
    });

    test('[AUTH-028] Passwords setup with the old code', async ({ api, confirmationCodeRepository }) => {
      const resendCode = await api.auth.resendRegistrationCode({ email: user.email });
      expect(resendCode.response).toHaveStatus2xx();
      const newCode = await confirmationCodeRepository.getLastUserCode(user.id!);

      const setupPassword = await api.auth.setupPassword(user.email!, confirmationCode.code, {
        newPassword: user.password,
        confirmNewPassword: user.password,
      });

      expect(setupPassword.response).toHaveStatus4xx();
      const login = await api.auth.login({
        identifier: user.email,
        password: user.password,
      });
      expect(login.response).toHaveStatus4xx();

      const setupPasswordWithNewCode = await api.auth.setupPassword(user.email!, newCode.code!, {
        newPassword: user.password,
        confirmNewPassword: user.password,
      });

      expect(setupPasswordWithNewCode.response).toHaveStatus2xx();

      const loginAgain = await api.auth.login({
        identifier: user.email,
        password: user.password,
      });
      expect(loginAgain.response).toHaveStatus2xx();
    });
  },
);
