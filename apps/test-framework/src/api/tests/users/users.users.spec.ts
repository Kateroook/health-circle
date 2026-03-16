import { UserBuilder } from '../../../core/data/builders/user-builder';
import { UserFactory } from '../../../core/data/factories/user-factory';
import { expect, test } from '../../fixtures/api-fixture';

test.describe('User Creation', () => {
  test.describe('Happy Path', () => {
    test('Successfull creation of the user with all filled fields', async ({ api }) => {
      const userData = new UserBuilder()
        .withFirstName('Oleh')
        .withLastName('Bondarenko')
        .withMiddleName('Victorovich')
        .withEmail('oleh0676@gmail.com')
        .withPhone('+380677655665')
        .build();
      const newUser = await api.users.createUser(userData);
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
      await expect(newUser.response).toHaveStatus2xx();
    });

    test('Successfull creation of the user without a middle name field', async ({ api }) => {
      const userData = new UserBuilder()
        .withFirstName('Andrii')
        .withLastName('Ivanenko')
        .withEmail('andrii8690@gmail.com')
        .withPhone('+380962365445')
        .build();
      const newUser = await api.users.createUser(userData);
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
      await expect(newUser.response).toHaveStatus2xx();
    });

    test('The registration a new user id in DbCleaner', async ({ api }) => {
      const user = UserFactory.createRandomUser();
      const newUser = await api.users.createUser(user);
      const responseData = await newUser.response.json();
      const createdId = responseData.id;
      const cleanerTasks = (api.users as any).dbCleaner.tasks;
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
      await expect(newUser.response).toHaveStatus2xx();
      await expect(cleanerTasks).toContainEqual({ table: 'users', id: createdId });
    });
  });

  test.describe('Negative: first name validation', () => {
    test('User creation with an empty first name field', async ({ api }) => {
      const user = UserFactory.createRandomUser({ firstName: '' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a one-symbol first name field', async ({ api }) => {
      const user = UserFactory.createRandomUser({ firstName: 'A' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a first name consisting only of whitespace characters', async ({ api }) => {
      const user = UserFactory.createRandomUser({ firstName: '    ' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a first name consisting only of special characters', async ({ api }) => {
      const user = UserFactory.createRandomUser({ firstName: '!@#$' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a first name consisting of 51 symbols', async ({ api }) => {
      const user = UserFactory.createRandomUser({ firstName: 'ВолодимирВолодимирВолодимирВолодимирВолодимирВолоди' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation without first name field', async ({ api }) => {
      const user = UserFactory.createRandomUser({ firstName: null as any });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });
  });

  test.describe('Negative: last name validation', () => {
    test('User creation with an empty last name field', async ({ api }) => {
      const user = UserFactory.createRandomUser({ lastName: '' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a one-symbol last name field', async ({ api }) => {
      const user = UserFactory.createRandomUser({ lastName: 'B' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a last name consisting only of whitespace characters', async ({ api }) => {
      const user = UserFactory.createRandomUser({ lastName: '      ' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a last name consisting only of special characters', async ({ api }) => {
      const user = UserFactory.createRandomUser({ lastName: '!@#$' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a last name consisting of 51 symbols', async ({ api }) => {
      const user = UserFactory.createRandomUser({ lastName: 'ІваненкоІваненкоІваненкоІваненкоІваненкоІваненкоІва' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation without last name field', async ({ api }) => {
      const user = UserFactory.createRandomUser({ lastName: null as any });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });
  });

  test.describe('Negative: middle name validation', () => {
    test('User creation with a middle name consisting only of whitespace characters', async ({ api }) => {
      const user = UserFactory.createRandomUser({ middleName: '      ' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a middle name consisting only of special characters', async ({ api }) => {
      const user = UserFactory.createRandomUser({ middleName: '!@#$' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a one-symbol middle name field', async ({ api }) => {
      const user = UserFactory.createRandomUser({ middleName: 'C' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with a middle name consisting of 51 symbols', async ({ api }) => {
      const user = UserFactory.createRandomUser({ middleName: 'ОлександровичОлександровичОлександровичОлександрови' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });
  });

  test.describe('Negative: email validation', () => {
    test('User creation with an empty email field', async ({ api }) => {
      const user = UserFactory.createRandomUser({ email: '' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation without an email field', async ({ api }) => {
      const user = UserFactory.createRandomUser({ email: null as any });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });

    test('User creation with an incorrect email', async ({ api }) => {
      const user = UserFactory.createRandomUser({ email: 'notanemail' });
      const newUser = await api.users.createUser(user);
      await expect(newUser.response).toHaveStatus4xx();
      console.log(await newUser.response.json());
      console.log('Статус код:', newUser.response.status());
    });
  });
});
