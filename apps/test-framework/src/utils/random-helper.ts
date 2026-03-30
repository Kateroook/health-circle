import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import { customAlphabet, nanoid } from 'nanoid';
import * as path from 'path';

export class RandomHelper {
  public static readonly CHARSETS = {
    UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
    NUMBERS: '0123456789',
    SPECIAL: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
  };

  uuid() {
    return faker.string.uuid();
  }

  shortId(length = 8) {
    return nanoid(length);
  }

  string({
    length = 10,
    charset = '',
    includeUpper = true,
    includeLower = true,
    includeNumbers = true,
    includeSpecial = true,
  }: {
    length?: number;
    charset?: string;
    includeUpper?: boolean;
    includeLower?: boolean;
    includeNumbers?: boolean;
    includeSpecial?: boolean;
  } = {}): string {
    let combinedCharset = charset;

    if (includeUpper) combinedCharset += RandomHelper.CHARSETS.UPPERCASE;
    if (includeLower) combinedCharset += RandomHelper.CHARSETS.LOWERCASE;
    if (includeNumbers) combinedCharset += RandomHelper.CHARSETS.NUMBERS;
    if (includeSpecial) combinedCharset += RandomHelper.CHARSETS.SPECIAL;

    if (!combinedCharset) {
      throw new Error('At least one character set must be selected or provided via charset.');
    }

    const generator = customAlphabet(combinedCharset, length);
    return generator();
  }

  password(length = 12) {
    const mandatory = [
      this.pick(RandomHelper.CHARSETS.UPPERCASE.split('')),
      this.pick(RandomHelper.CHARSETS.LOWERCASE.split('')),
      this.pick(RandomHelper.CHARSETS.NUMBERS.split('')),
      this.pick(RandomHelper.CHARSETS.SPECIAL.split('')),
    ];

    const remainingLength = length - mandatory.length;
    const remaining = this.string({
      length: remainingLength,
      includeSpecial: true,
    }).split('');

    return faker.helpers.shuffle([...mandatory, ...remaining]).join('');
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
    return faker.company.name();
  }

  alias({ count = 1 }) {
    return faker.word.words(count);
  }

  number({ min = 1, max = 100 }) {
    return Number(faker.number.bigInt({ min, max }));
  }

  pick<T>(array: T[]): T {
    return faker.helpers.arrayElement(array);
  }
  
  avatar(fileType?: '.png' | '.jpg' | '.jpeg') {
    const avatarsDir = path.resolve(__dirname, '../core/data/pictures/avatars');

    const allFiles = fs.readdirSync(avatarsDir);

    const filtered = fileType
      ? allFiles.filter((f) => f.toLowerCase().endsWith(fileType))
      : allFiles.filter((f) => /\.(png|jpe?g)$/i.test(f));

    if (!filtered.length) {
      throw new Error(`No files found in ${avatarsDir}${fileType ? ` with extension ${fileType}` : ''}`);
    }

    const filename = this.pick(filtered);
    const filepath = path.join(avatarsDir, filename);
    const buffer = fs.readFileSync(filepath);
    const ext = path.extname(filename).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };

    return {
      buffer,
      filename,
      mimeType: mimeTypes[ext] ?? 'application/octet-stream',
    };
  }
}
