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
  Validate,
} from 'class-validator';
import { UserUniqueConstraint } from 'src/common/constraints/user-unique.constraint';

export class CreateUserDto {
  @IsDefined({ message: 'Поле електронної пошти є обовʼязковим' })
  @IsEmail({}, { message: 'Некоректний формат електронної пошти' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @Validate(UserUniqueConstraint, ['email'], { message: 'Електронна пошта вже використовується іншим користувачем' })
  email: string;

  @IsDefined({ message: 'Поле імені є обовʼязковим' })
  @IsString({ message: 'Імʼя має бути рядком' })
  @IsNotEmpty({ message: 'Імʼя не може бути порожнім' })
  @MinLength(2, { message: 'Імʼя має містити не менше 2 символів' })
  @MaxLength(50, { message: 'Імʼя має містити не більше 50 символів' })
  firstName: string;

  @IsOptional()
  @IsString({ message: 'По-батькові має бути рядком' })
  @MinLength(2, { message: 'По-батькові має містити не менше 2 символів' })
  @MaxLength(50, { message: 'По-батькові має містити не більше 50 символів' })
  middleName?: string;

  @IsDefined({ message: 'Поле прізвища є обовʼязковим' })
  @IsString({ message: 'Прізвище має бути рядком' })
  @IsNotEmpty({ message: 'Прізвище не може бути порожнім' })
  @MinLength(2, { message: 'Прізвище має містити не менше 2 символів' })
  @MaxLength(50, { message: 'Прізвище має містити не більше 50 символів' })
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Повне імʼя має бути рядком' })
  @MaxLength(255, { message: 'Повне імʼя має містити не більше 255 символів' })
  fullName: string;

  @ApiProperty({ example: '+380922022491' })
  @IsDefined({ message: 'Поле номера телефону є обовʼязковим' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Некоректний формат номера телефону (має починатися з + та містити від 7 до 15 цифр)',
  })
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
}
