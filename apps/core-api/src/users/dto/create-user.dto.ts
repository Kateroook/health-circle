import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  registerDecorator,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { UserUniqueConstraint } from 'src/common/constraints/user-unique.constraint';

const trimString = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimOptionalString = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimEmptyOptionalString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
};

function IsEmailLocalPartMaxLength(maxLength: number, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isEmailLocalPartMaxLength',
      target: object.constructor,
      propertyName,
      constraints: [maxLength],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          const [limit] = args.constraints as [number];
          const atIndex = value.indexOf('@');

          if (atIndex <= 0) {
            return false;
          }

          const localPart = value.slice(0, atIndex);
          return localPart.length <= limit;
        },
      },
    });
  };
}

export class CreateUserDto {
  @IsDefined({ message: 'Поле електронної пошти є обовʼязковим' })
  @IsEmail({}, { message: 'Некоректний формат електронної пошти' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmailLocalPartMaxLength(50, { message: 'Локальна частина електронної пошти має містити не більше 50 символів' })
  @Validate(UserUniqueConstraint, ['email'], { message: 'Електронна пошта вже використовується іншим користувачем' })
  email: string;

  @IsDefined({ message: 'Поле імені є обовʼязковим' })
  @Transform(trimString)
  @IsString({ message: 'Імʼя має бути рядком' })
  @IsNotEmpty({ message: 'Імʼя не може бути порожнім' })
  @Matches(/\p{L}/u, { message: 'Імʼя має містити хоча б одну літеру' })
  @MinLength(2, { message: 'Імʼя має містити не менше 2 символів' })
  @MaxLength(50, { message: 'Імʼя має містити не більше 50 символів' })
  firstName: string;

  @ValidateIf((o) => o.middleName !== undefined)
  @Transform(trimOptionalString)
  @IsString({ message: 'По батькові має бути рядком' })
  @IsNotEmpty({ message: 'По батькові не може бути порожнім' })
  @Matches(/\p{L}/u, { message: 'По батькові має містити хоча б одну літеру' })
  @MinLength(2, { message: 'По батькові має містити не менше 2 символів' })
  @MaxLength(50, { message: 'По батькові має містити не більше 50 символів' })
  middleName?: string;

  @IsDefined({ message: 'Поле прізвища є обовʼязковим' })
  @Transform(trimString)
  @IsString({ message: 'Прізвище має бути рядком' })
  @IsNotEmpty({ message: 'Прізвище не може бути порожнім' })
  @Matches(/\p{L}/u, { message: 'Прізвище має містити хоча б одну літеру' })
  @MinLength(2, { message: 'Прізвище має містити не менше 2 символів' })
  @MaxLength(50, { message: 'Прізвище має містити не більше 50 символів' })
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimEmptyOptionalString)
  @IsString({ message: 'Повне імʼя має бути рядком' })
  @MaxLength(255, { message: 'Повне імʼя має містити не більше 255 символів' })
  fullName: string;

  @ApiProperty({ example: '+380922022491' })
  @IsDefined({ message: 'Поле номера телефону є обовʼязковим' })
  @IsString()
  @Matches(/^\+[1-9]\d{5,14}$/, { message: 'Некоректний формат номера телефону' })
  @Validate(UserUniqueConstraint, ['phone'], { message: 'Номер телефону вже використовується іншим користувачем' })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  alertRegionUid?: number;
}
