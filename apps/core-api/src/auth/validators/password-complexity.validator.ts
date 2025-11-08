import { registerDecorator, type ValidationArguments, type ValidationOptions } from 'class-validator';

// Requires a password to contain at least `minCategories` of 4 categories:
// uppercase letters, lowercase letters, digits, special characters.
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
          const upper = /[A-Z]/.test(value) ? 1 : 0;
          const lower = /[a-z]/.test(value) ? 1 : 0;
          const digit = /[0-9]/.test(value) ? 1 : 0;
          // treat only these specific symbols as "special"
          const special = /[;:!@#$%^&()_\-=+]/.test(value) ? 1 : 0;
          const categories = upper + lower + digit + special;
          const required = (args.constraints?.[0] as number) ?? 3;
          return categories >= required;
        },
        defaultMessage(args: ValidationArguments) {
          const required = (args.constraints?.[0] as number) ?? 3;
          return `Пароль має містити щонайменше ${required} з 4 категорій: великі літери, малі літери, цифри, спеціальні символи ;:!@#$%^&()_-+=`;
        },
      },
    });
  };
};
