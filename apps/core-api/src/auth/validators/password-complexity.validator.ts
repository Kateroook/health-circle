import { registerDecorator, type ValidationArguments, type ValidationOptions } from 'class-validator';

/**
 * Requires a password to contain at least `minCategories` of 4 categories:
 * 1. Uppercase letters (Any language)
 * 2. Lowercase letters (Any language)
 * 3. Digits
 * 4. Special characters/Symbols
 */
export const PasswordComplexity = (minCategories = 3, validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'PasswordComplexity',
      target: object.constructor,
      propertyName,
      constraints: [minCategories],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // \p{Lu} = Any Unicode Uppercase Letter
          // \p{Ll} = Any Unicode Lowercase Letter
          // \p{N}  = Any Unicode Number
          // \p{P}  = Any Unicode Punctuation
          // \p{S}  = Any Unicode Symbol
          // The 'u' flag is required for Unicode property escapes!

          const hasUpper = /\p{Lu}/u.test(value) ? 1 : 0;
          const hasLower = /\p{Ll}/u.test(value) ? 1 : 0;
          const hasDigit = /\p{N}/u.test(value) ? 1 : 0;
          const hasSpecial = /[\p{P}\p{S}]/u.test(value) ? 1 : 0;

          const categories = hasUpper + hasLower + hasDigit + hasSpecial;
          const required = (args.constraints?.[0] as number) ?? 3;
          return categories >= required;
        },
        defaultMessage(args: ValidationArguments) {
          const required = (args.constraints?.[0] as number) ?? 3;
          return `Пароль має бути складнішим. Використовуйте принаймні ${required} з 4 типів символів: великі літери, малі літери, цифри та спеціальні символи.`;
        },
      },
    });
  };
};
