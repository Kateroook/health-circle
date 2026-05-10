import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'GET /api/auth/check-email and /api/auth/check-phone tests',
  {
    tag: '@auth',
  },
  async () => {
    test(
      '[AUTH-058] Check free email successfully',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const freeEmail = utils.random.email();
        const check = await api.auth.checkEmail(freeEmail);
        expect(check.response).toHaveStatus2xx();
      },
    );

    test(
      '[AUTH-059] Error when checking occupied email',
      {
        tag: '@smoke',
      },
      async ({ api, spawnUser }) => {
        const user = await spawnUser();
        const check = await api.auth.checkEmail(user.email);
        expect(check.response).toHaveStatus(400);
      },
    );

    test(
      '[AUTH-060] Case insensitivity when checking email',
      {
        tag: '@sanity',
      },
      async ({ api, spawnUser }) => {
        const user = await spawnUser();
        const check = await api.auth.checkEmail(user.email.toUpperCase());
        expect(check.response).toHaveStatus(400);
      },
    );

    test(
      '[AUTH-061] Check free phone successfully',
      {
        tag: '@smoke',
      },
      async ({ api }) => {
        const freePhone = utils.random.phone();
        const check = await api.auth.checkPhone(freePhone);
        expect(check.response).toHaveStatus2xx();
      },
    );

    test(
      '[AUTH-062] Error when checking occupied phone',
      {
        tag: '@smoke',
      },
      async ({ api, spawnUser }) => {
        const user = await spawnUser();
        const check = await api.auth.checkPhone(user.phone);
        expect(check.response).toHaveStatus(400);
      },
    );

    test(
      '[AUTH-063] Error when checking invalid phone format',
      {
        tag: '@sanity',
      },
      async ({ api }) => {
        const check = await api.auth.checkPhone('invalid_phone');
        expect(check.response).toHaveStatus(400);
      },
    );
  },
);
