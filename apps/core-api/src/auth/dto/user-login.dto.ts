import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UserLoginDto {
  @IsEmail({}, { message: 'Некоректний формат електронної пошти' })
  @IsNotEmpty({ message: 'Електронна пошта не може бути порожньою' })
  @IsDefined({ message: 'Поле електронної пошти є обовʼязковим' })
  @MaxLength(50, { message: 'Електронна пошта не може перевищувати 50 символів' })
  @Transform(({ value }) => typeof value === 'string' && value.trim().toLowerCase())
  email: string;

  @IsString({ message: 'Пароль має бути рядком' })
  @IsNotEmpty({ message: 'Пароль не може бути порожнім' })
  @IsDefined({ message: 'Поле паролю є обовʼязковим' })
  @MinLength(12, { message: 'Пароль має містити щонайменше 12 символів' })
  @MaxLength(20, { message: 'Пароль не може перевищувати 20 символів' })
  @Transform(({ value }) => typeof value === 'string' && value.trim())
  password: string;
}
