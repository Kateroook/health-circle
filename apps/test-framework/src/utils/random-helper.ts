import { faker } from '@faker-js/faker';
import { nanoid } from 'nanoid';

export class RandomHelper {
  shortId(length = 8) {
    return nanoid(length);
  }

  password(length = 12) {
    return nanoid(length);
  }

  firstName() {
    return faker.person.firstName();
  }

  lastName() {
    return faker.person.lastName();
  }

  middleName() {
    return faker.person.middleName();
  }

  email({
    prefix = 'test',
    domain = 'gmail.com',
  }: {
    prefix?: string;
    domain?: string;
  } = {}) {
    return `${prefix}${nanoid(10)}@${domain}`;
  }

  phone(country: 'ua' | 'us' | 'uk' | 'de' | 'pl' = 'ua') {
    const config = {
      ua: {
        code: '+380',
        operators: [
          '67',
          '68',
          '96',
          '97',
          '98', // Kyivstar
          '50',
          '66',
          '95',
          '99', // Vodafone
          '63',
          '73',
          '93', // lifecell
          '91', // Укртелеком
          '92', // Tele2
        ],
        subscriberLength: 7,
      },
      us: {
        code: '+1',
        operators: [
          '201',
          '202',
          '212',
          '213',
          '312', // AT&T
          '310',
          '415',
          '424',
          '469',
          '512', // T-Mobile
          '614',
          '646',
          '702',
          '713',
          '818', // Verizon
        ],
        subscriberLength: 7,
      },
      uk: {
        code: '+44',
        operators: [
          '7400',
          '7500',
          '7700',
          '7800', // EE
          '7300',
          '7400', // O2
          '7900',
          '7800', // Vodafone UK
          '7700',
          '7600', // Three
        ],
        subscriberLength: 6,
      },
      de: {
        code: '+49',
        operators: [
          '151',
          '152',
          '157', // Telekom
          '160',
          '170',
          '171', // Vodafone DE
          '159',
          '176',
          '177', // O2 DE
        ],
        subscriberLength: 7,
      },
      pl: {
        code: '+48',
        operators: [
          '500',
          '501',
          '502',
          '503', // Orange PL
          '510',
          '511',
          '512',
          '513', // Play
          '600',
          '601',
          '602',
          '603', // T-Mobile PL
          '720',
          '721',
          '722',
          '723', // Plus
        ],
        subscriberLength: 6,
      },
    };

    const { code, operators, subscriberLength } = config[country];
    const operator = faker.helpers.arrayElement(operators);
    const subscriber = Array.from({ length: subscriberLength }, () => faker.number.int({ min: 0, max: 9 })).join('');

    return `${code}${operator}${subscriber}`;
  }

  groupName() {
    return `${faker.company.name}`;
  }

  alias({ count = 1 }) {
    return faker.word.words(count);
  }

  number({ min = 1, max = 100 }) {
    return faker.number.bigInt({
      min: min,
      max: max,
    });
  }

  pick<T>(array: T[]): T {
    return faker.helpers.arrayElement(array);
  }
}
