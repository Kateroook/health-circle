import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsString({ message: 'Email має бути рядком' })
  @IsNotEmpty({ message: 'Email не може бути порожнім' })
  @IsDefined({ message: 'Email обовʼязковий' })
  @IsEmail({}, { message: 'Невірний формат email' })
  @Transform(({ value }) => typeof value === 'string' && value.trim().toLowerCase())
  email: string;
}
