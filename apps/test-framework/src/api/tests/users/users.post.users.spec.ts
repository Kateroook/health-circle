import { faker } from '@faker-js/faker';
import { UserFactory } from '../../../core/data/factories/user-factory';
import { utils } from '../../../utils/utils';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('Happy path', () => {
  test('[USR-001] Successfull creation of the user with all filled fields', async ({ api, userRepository }) => {
    const user = UserFactory.createRandomUser({ middleName: utils.random.middleName() });
    const newUser = await api.users.createUser(user);
    const responseData = await newUser.response.json();
    const createdId = responseData.id;
    const dbUser = await userRepository.getById(createdId);

    await expect(newUser.response).toHaveStatus(201);
    await expect(dbUser).toBeDefined();
    await expect(dbUser?.email).toBe(user.email.toLowerCase());
    await expect(dbUser?.phone).toBe(user.phone);
    await expect(dbUser?.firstName).toBe(user.firstName);
    await expect(dbUser?.lastName).toBe(user.lastName);
    await expect(dbUser?.middleName).toBe(user.middleName);
  });

  test('[USR-002] Successfull creation of the user without a middle name field', async ({ api, userRepository }) => {
    const user = UserFactory.createRandomUser();
    const newUser = await api.users.createUser(user);
    const responseData = await newUser.response.json();
    const createdId = responseData.id;
    const dbUser = await userRepository.getById(createdId);

    await expect(newUser.response).toHaveStatus(201);
    await expect(dbUser).toBeDefined();
    await expect(dbUser?.email).toBe(user.email.toLowerCase());
    await expect(dbUser?.phone).toBe(user.phone);
    await expect(dbUser?.firstName).toBe(user.firstName);
    await expect(dbUser?.lastName).toBe(user.lastName);
    await expect(dbUser?.middleName).toBe(null);
  });

  test('[USR-003] The registration a new user id in DbCleaner', async ({ api }) => {
    const user = UserFactory.createRandomUser();
    const newUser = await api.users.createUser(user);
    const responseData = await newUser.response.json();
    const createdId = responseData.id;
    const cleanerTasks = (api.users as any).dbCleaner.tasks;
    await expect(newUser.response).toHaveStatus2xx();
    await expect(cleanerTasks).toContainEqual({ table: 'users', id: createdId });
  });

  test('[USR-028] Successfull user creation with a non-Ukrainian phone number', async ({ api, userRepository }) => {
    const foreignCountries = ['us', 'uk', 'de', 'pl'] as const;
    const randomForeignPhone = utils.random.phone(faker.helpers.arrayElement(foreignCountries));
    const user = UserFactory.createRandomUser({ phone: randomForeignPhone });
    const newUser = await api.users.createUser(user);
    const responseData = await newUser.response.json();
    const createdId = responseData.id;
    const dbUser = await userRepository.getById(createdId);
    await expect(newUser.response).toHaveStatus(201);
    await expect(dbUser).toBeDefined();
    await expect(dbUser?.email).toBe(user.email.toLowerCase());
    await expect(dbUser?.phone).toBe(user.phone);
    await expect(dbUser?.firstName).toBe(user.firstName);
    await expect(dbUser?.lastName).toBe(user.lastName);
    await expect(dbUser?.middleName).toBe(null);
  });
});

test.describe('Negative: first name validation', () => {
  [
    {
      testName: '[USR-004] User creation with an empty first name field',
      firstName: '',
    },
    {
      testName: '[USR-005] User creation with a one-symbol first name field',
      firstName: utils.random.string({ length: 1, includeSpecial: false }),
    },
    {
      testName: '[USR-006] User creation with a first name consisting only of whitespace characters',
      firstName: utils.random.string({
        length: utils.random.number({ min: 1, max: 50 }),
        charset: ' ',
        includeLower: false,
        includeNumbers: false,
        includeSpecial: false,
        includeUpper: false,
      }),
    },
    {
      testName: '[USR-007] User creation with a first name consisting only of special characters',
      firstName: utils.random.string({
        length: utils.random.number({ min: 1, max: 50 }),
        includeLower: false,
        includeNumbers: false,
        includeSpecial: true,
        includeUpper: false,
      }),
    },
    {
      testName: '[USR-008] User creation with a first name consisting of 51 symbols',
      firstName: utils.random.shortId(51),
    },
    {
      testName: '[USR-009] User creation without first name field',
      firstName: undefined,
    },
  ].forEach((options) => {
    test(options.testName, async ({ api }) => {
      const user = UserFactory.createRandomUser({ firstName: options.firstName });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus(400);
    });
  });
});

test.describe('Negative: last name validation', () => {
  [
    {
      testName: '[USR-010] User creation with an empty last name field',
      lastName: '',
    },
    {
      testName: '[USR-011] User creation with a one-symbol last name field',
      lastName: utils.random.string({ length: 1, includeSpecial: false }),
    },
    {
      testName: '[USR-012] User creation with a last name consisting only of whitespace characters',
      lastName: utils.random.string({
        length: utils.random.number({ min: 1, max: 50 }),
        charset: ' ',
        includeLower: false,
        includeNumbers: false,
        includeSpecial: false,
        includeUpper: false,
      }),
    },
    {
      testName: '[USR-013] User creation with a last name consisting only of special characters',
      lastName: utils.random.string({
        length: utils.random.number({ min: 1, max: 50 }),
        includeLower: false,
        includeNumbers: false,
        includeSpecial: true,
        includeUpper: false,
      }),
    },
    {
      testName: '[USR-014] User creation with a last name consisting of 51 symbols',
      lastName: utils.random.shortId(51),
    },
    {
      testName: '[USR-015] User creation without last name field',
      lastName: undefined,
    },
  ].forEach((options) => {
    test(options.testName, async ({ api }) => {
      const user = UserFactory.createRandomUser({ lastName: options.lastName });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus(400);
    });
  });
});

test.describe('Negative: middle name validation', () => {
  [
    {
      testName: '[USR-016] User creation with a middle name consisting only of whitespace characters',
      middleName: utils.random.string({
        length: utils.random.number({ min: 1, max: 50 }),
        charset: ' ',
        includeLower: false,
        includeNumbers: false,
        includeSpecial: false,
        includeUpper: false,
      }),
    },
    {
      testName: '[USR-017] User creation with a middle name consisting only of special characters',
      middleName: utils.random.string({
        length: utils.random.number({ min: 1, max: 50 }),
        includeLower: false,
        includeNumbers: false,
        includeSpecial: true,
        includeUpper: false,
      }),
    },
    {
      testName: '[USR-018] User creation with a one-symbol middle name field',
      middleName: utils.random.string({ length: 1, includeSpecial: false }),
    },
    {
      testName: '[USR-019] User creation with a middle name consisting of 51 symbols',
      middleName: utils.random.shortId(51),
    },
  ].forEach((options) => {
    test(options.testName, async ({ api }) => {
      const user = UserFactory.createRandomUser({ middleName: options.middleName });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus(400);
    });
  });
});

test.describe('Negative: email validation', () => {
  [
    {
      testName: '[USR-020] User creation with an empty email field',
      email: '',
    },
    {
      testName: '[USR-021] User creation without an email field',
      email: undefined,
    },
    {
      testName: '[USR-022] User creation with an incorrect email',
      email: utils.random.string({
        length: utils.random.number({ min: 1, max: 50 }),
        includeSpecial: false,
      }),
    },
    {
      testName: '[USR-024] User creation with a 51-symbol local part in the email field',
      email: utils.random.email({
        prefix: utils.random.shortId(41),
      }),
    },
  ].forEach((options) => {
    test(options.testName, async ({ api }) => {
      const user = UserFactory.createRandomUser({ email: options.email });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus(400);
    });
  });
  test('[USR-023] The registration of the registered user', async ({ api }) => {
    const userA = UserFactory.createRandomUser();
    const newUser = await api.users.createUser(userA);
    await expect(newUser.response).toHaveStatus(201);
    const userB = UserFactory.createRandomUser({ email: userA.email });
    const registeredUser = await api.users.createUser(userB);
    const status = registeredUser.response.status();
    await expect([400, 409]).toContain(status);
  });

  test('[USR-025] The registration of the email in different registers', async ({ api }) => {
    const baseEmail = utils.random.email().toLowerCase();
    const userA = UserFactory.createRandomUser({ email: baseEmail });
    const newUser = await api.users.createUser(userA);
    await expect(newUser.response).toHaveStatus(201);
    const userB = UserFactory.createRandomUser({ email: baseEmail.toUpperCase() });
    const registeredUser = await api.users.createUser(userB);
    const status = registeredUser.response.status();
    await expect([400, 409]).toContain(status);
  });
});

test.describe('Negative: phone validation', () => {
  const countries = ['ua', 'us', 'uk', 'de', 'pl'] as const;

  const randomPhone29 = utils.random.phone(faker.helpers.arrayElement(countries));
  const smallPhone = randomPhone29.substring(0, randomPhone29.length - 3);
  const randomPhone30 = utils.random.phone(faker.helpers.arrayElement(countries));
  const phoneWithSpecialChars =
    randomPhone30.substring(0, randomPhone30.length - 3) +
    utils.random.string({
      length: 3,
      includeLower: false,
      includeNumbers: false,
      includeSpecial: true,
      includeUpper: false,
    });

  [
    {
      testName: '[USR-026] User creation with an empty phone number',
      phone: '',
    },
    {
      testName: '[USR-027] User creation without a phone number field',
      phone: undefined,
    },
    {
      testName: '[USR-029] User creation with an incomplete phone number',
      phone: smallPhone,
    },
    {
      testName: '[USR-030] User creation with a phone number containing special characters',
      phone: phoneWithSpecialChars,
    },
  ].forEach((options) => {
    test(options.testName, async ({ api }) => {
      const user = UserFactory.createRandomUser({ phone: options.phone });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus(400);
    });
  });
});
