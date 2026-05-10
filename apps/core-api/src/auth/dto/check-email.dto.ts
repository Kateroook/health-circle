import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CheckEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString({ message: 'Email має бути рядком' })
  @IsNotEmpty({ message: 'Email не може бути порожнім' })
  @IsDefined({ message: 'Email обовʼязковий' })
  @IsEmail({}, { message: 'Невірний формат email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;
}
