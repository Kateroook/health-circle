import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe(
  'PUT /api/users/status tests',
  {
    tag: '@users',
  },
  async () => {
    let user: any;
    test.beforeEach(async ({ spawnUser }) => {
      user = await spawnUser();
    });
    [
      {
        testName: '[USR-050] Setting SAFE status',
        data: { status: 'SAFE' },
        expectedStatus: 200,
      },
      {
        testName: '[USR-051] Setting DANGER status',
        data: { status: 'DANGER' },
        expectedStatus: 200,
      },
      {
        testName: '[USR-052] Setting UNKNOWN status',
        data: { status: 'UNKNOWN' },
        expectedStatus: 200,
      },
      {
        testName: '[USR-053] Setting invalid status value',
        data: { status: utils.random.shortId() },
        expectedStatus: 400,
      },
      {
        testName: '[USR-054] Setting empty status',
        data: { status: '' },
        expectedStatus: 400,
      },
    ].forEach((options) => {
      test(options.testName, async ({ api, userRepository }) => {
        await api.auth.quickLogin(user.email, user.password);
        const response = await api.users.updateUserStatus(options.data as any);
        expect(response.response).toHaveStatus(options.expectedStatus);
        if (options.expectedStatus === 200) {
          const dbUser = await userRepository.getById(user.id!);
          expect(dbUser?.status).toBe(options.data.status);
        }
      });
    });

    test('[USR-055] Setting status without authorization', async ({ api }) => {
      const response = await api.users.updateUserStatus({
        status: utils.random.pick(['SAFE', 'DANGER', 'UNKNOWN']),
      });

      expect(response.response).toHaveStatus(401);
    });
  },
);
