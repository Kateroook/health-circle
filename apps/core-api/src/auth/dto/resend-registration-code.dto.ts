import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResendRegistrationCodeDto {
  @IsString({ message: 'Email має бути рядком' })
  @IsNotEmpty({ message: 'Email не може бути порожнім' })
  @IsDefined({ message: 'Email обовʼязковий' })
  @IsEmail({}, { message: 'Невірний формат email' })
  @Transform(({ value }: { value: unknown }): unknown => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;
}
