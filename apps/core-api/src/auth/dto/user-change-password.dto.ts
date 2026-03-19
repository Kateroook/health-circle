import { Transform } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { PasswordComplexity } from '../validators/password-complexity.validator';

export class UserChangePasswordDto {
  @IsString({ message: 'Старий пароль має бути рядком' })
  @IsNotEmpty({ message: 'Старий пароль не може бути порожнім' })
  @IsDefined({ message: 'Старий пароль обовʼязковий' })
  @MinLength(12, { message: 'Старий пароль має містити щонайменше 12 символів' })
  @MaxLength(20, { message: 'Старий пароль не може перевищувати 20 символів' })
  @Transform(({ value }) => typeof value === 'string' && value.trim())
  oldPassword: string;

  @IsString({ message: 'Новий пароль має бути рядком' })
  @IsNotEmpty({ message: 'Новий пароль не може бути порожнім' })
  @IsDefined({ message: 'Новий пароль обовʼязковий' })
  @MinLength(12, { message: 'Новий пароль має містити щонайменше 12 символів' })
  @MaxLength(20, { message: 'Новий пароль не може перевищувати 20 символів' })
  @PasswordComplexity(4, { message: 'Пароль має містити великі, малі літери, цифри та символи' })
  @Transform(({ value }) => typeof value === 'string' && value.trim())
  newPassword: string;

  @IsString({ message: 'Підтвердження паролю має бути рядком' })
  @IsNotEmpty({ message: 'Підтвердження паролю не може бути порожнім' })
  @IsDefined({ message: 'Поле підтвердження паролю обовʼязкове' })
  @MinLength(12, { message: 'Підтвердження паролю має містити щонайменше 12 символів' })
  @MaxLength(20, { message: 'Підтвердження паролю не може перевищувати 20 символів' })
  @Transform(({ value }) => typeof value === 'string' && value.trim())
  confirmNewPassword: string;
}
