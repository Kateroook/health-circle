import { Transform } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UserLoginDto {
  @IsNotEmpty({ message: 'Електронна пошта або телефон не можуть бути порожніми' })
  @IsDefined({ message: 'Поле електронної пошти або телефону є обовʼязковим' })
  @MaxLength(50, { message: 'Електронна пошта або телефон не можуть перевищувати 50 символів' })
  @Transform(({ value }) => typeof value === 'string' && value.trim().toLowerCase())
  identifier: string;

  @IsString({ message: 'Пароль має бути рядком' })
  @IsNotEmpty({ message: 'Пароль не може бути порожнім' })
  @IsDefined({ message: 'Поле паролю є обовʼязковим' })
  @MinLength(12, { message: 'Пароль має містити щонайменше 12 символів' })
  @MaxLength(20, { message: 'Пароль не може перевищувати 20 символів' })
  @Transform(({ value }) => typeof value === 'string' && value.trim())
  password: string;
}
