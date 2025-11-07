import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TokenQueryDto {
  @IsEmail({}, { message: 'Некоректний формат електронної пошти' })
  @IsNotEmpty({ message: 'Електронна пошта не може бути порожньою' })
  @IsDefined({ message: 'Поле електронної пошти є обовʼязковим' })
  @MaxLength(50, {
    message: 'Електронна пошта не може перевищувати 50 символів',
  })
  @Transform(({ value }) => typeof value === 'string' && value.trim().toLowerCase())
  email: string;

  @IsString({ message: 'Токен має бути рядком' })
  @IsNotEmpty({ message: 'Токен не може бути порожнім' })
  @IsDefined({ message: 'Поле токену є обовʼязковим' })
  token: string;
}
