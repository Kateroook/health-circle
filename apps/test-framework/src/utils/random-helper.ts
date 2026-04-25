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

  countryCode(country: 'ua' | 'us' | 'uk' | 'de' | 'pl' | 'fr' | 'it' | 'es' | 'cz' | 'at' = 'ua'): string {
    const codes = {
      ua: '+380',
      us: '+1',
      uk: '+44',
      de: '+49',
      pl: '+48',
      fr: '+33',
      it: '+39',
      es: '+34',
      cz: '+420',
      at: '+43',
    };
    return codes[country];
  }
  phone(
    country: 'ua' | 'us' | 'uk' | 'de' | 'pl' | 'fr' | 'it' | 'es' | 'cz' | 'at' = 'ua',
    withCountryCode: boolean = true,
  ) {
    const config = {
      ua: {
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
      fr: {
        operators: ['6', '7'],
        subscriberLength: 8,
      },
      it: {
        operators: [
          '320',
          '324',
          '327',
          '328',
          '329', // WindTre
          '330',
          '331',
          '333',
          '334',
          '335',
          '336',
          '337',
          '338',
          '339', // TIM
          '340',
          '342',
          '344',
          '345',
          '346',
          '347',
          '348',
          '349', // Vodafone
          '360',
          '366',
          '368', // ТІМ (Old)
          '380',
          '388',
          '389', // WindTre
          '350',
          '351',
          '370', // MVNOs (Iliad, PosteMobile)
        ],
        subscriberLength: 7,
      },
      es: {
        operators: ['6', '7'],
        subscriberLength: 8,
      },
      cz: {
        operators: [
          '601',
          '602',
          '603',
          '604',
          '605',
          '606',
          '607',
          '608',
          '702',
          '720',
          '721',
          '722',
          '723',
          '724',
          '725',
          '726',
          '727',
          '728',
          '729',
          '730',
          '731',
          '732',
          '733',
          '734',
          '735',
          '736',
          '737',
          '738',
          '739',
          '770',
          '771',
          '772',
          '773',
          '774',
          '775',
          '776',
          '777',
          '778',
          '779',
          '790',
        ],
        subscriberLength: 6,
      },
      at: {
        operators: [
          '650', // Tele.Ring
          '660', // Drei
          '664', // A1
          '676', // T-Mobile
          '677', // HoT
          '680', // Bob
          '681', // Yesss!
          '688', // Ventocom
          '699', // Orange/Drei
        ],
        subscriberLength: 7,
      },
    };

    const { operators, subscriberLength } = config[country];
    const code = this.countryCode(country);
    const operator = faker.helpers.arrayElement(operators);
    const subscriber = Array.from({ length: subscriberLength }, () => faker.number.int({ min: 0, max: 9 })).join('');

    const fullNumber = `${operator}${subscriber}`;

    return withCountryCode ? `${code}${fullNumber}` : fullNumber;
  }

  phoneData() {
    const countries: ('ua' | 'us' | 'uk' | 'de' | 'pl' | 'fr' | 'it' | 'es' | 'cz' | 'at')[] = [
      'ua',
      'us',
      'uk',
      'de',
      'pl',
      'fr',
      'it',
      'es',
      'cz',
      'at',
    ];

    const randomCountry = faker.helpers.arrayElement(countries);

    return {
      country: randomCountry,
      code: this.countryCode(randomCountry),
      number: this.phone(randomCountry, false),
    };
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
