// OpenID UserInfo claims returned by the KyivCity provider
// Keys match the provider's payload (mix of snake_case and camelCase as specified)

export type OpenIdAddress = {
  id?: number; // Адреса реєстрації особи (ID)
  street_address?: string; // Вулиця та номер дому
  locality?: string; // Населений пункт
  region?: string; // Область
  postal_code?: string; // Поштовий індекс
  country?: string; // Назва країни
  address_uuid?: string; // UUID адреси
};

export type OpenIdOrganization = {
  name?: string; // Назва організації представника юридичної особи
  edrpou?: string; // ЕДРПОУ організації представника юридичної особи
  position?: string; // Посада представника юридичної особи
};

export type OpenIdProviderCode =
  | 'pbbankid' // BankID Приватбанк
  | 'nbubankid' // BankID НБУ
  | 'dia' // Дія
  | 'email'
  | 'eds' // УЕП/КЕП
  | 'phone' // логін-телефон
  | 'enterprise'; // КЕП/УЕП представника юр. особи

export type OpenIdNationality = 'UA' | 'UKR' | 'Україна' | 'Ukraine';

export type OpenIdUserInfo = {
  // Core subject identifier
  sub: number; // Номер облікового запису ідентифікованої особи у Модулі авторизації (#kyivid)

  // Standard OIDC address claim structure (snake_case keys per spec)
  address?: OpenIdAddress;

  // Contacts
  email?: string; // Значення адреси електронної пошти
  email_verified?: boolean; // Підтвердження пошти
  phone_number?: string; // Номер телефону
  phone_number_verified?: boolean; // Підтвердження номеру телефону

  // Profile names
  name?: string; // Повне ім'я: Ім'я Ім'я по батькові Прізвище
  preferred_username?: string; // Як вище (pref. username)
  given_name?: string; // Ім'я
  family_name?: string; // Прізвище
  middle_name?: string; // По батькові
  nickname?: string; // Псевдонім

  // Profile extras
  picture?: string; // Фото
  website?: string; // Веб-сторінка
  gender?: string; // Стать
  zoneinfo?: string; // Часовий пояс
  locale?: string; // Регіональні стандарти
  updated_at?: string; // Позначка часу (Unix timestamp as string)
  birthdate?: string; // РРРР-ММ-ДД

  // Identifiers
  itin?: string; // РНОКПП
  passport?: string; // ПГУ-1993 (серія та номер: 2 кириличні + 6 цифр)
  issue?: string; // Ким видано документ
  dateIssue?: string; // Дата видачі документу
  idCardNumber?: string; // ПГУ-2015 — номер паспорту
  idCardExpiryDate?: string; // ПГУ-2015 — строк дії (РРРР-ММ-ДД)

  // Registers
  uren?: string; // Унікальний номер запису в ЄДДР ('ХХХХХХХХ-ХХХХХ')
  birthPlace?: string; // Місце народження
  nationality?: OpenIdNationality; // UA/UKR/Україна/Ukraine (та ін.)

  // Organization
  organization?: OpenIdOrganization;

  // Account metadata
  hasVerifiedAccount?: boolean; // Чи має достовірний метод авторизації
  provider?: OpenIdProviderCode; // Ідентифікатор використаного методу авторизації
};
