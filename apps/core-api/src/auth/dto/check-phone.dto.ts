import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CheckPhoneDto {
  @ApiProperty({ example: '+380922022491' })
  @IsString({ message: 'Телефон має бути рядком' })
  @IsNotEmpty({ message: 'Телефон не може бути порожнім' })
  @IsDefined({ message: 'Телефон обовʼязковий' })
  @Matches(/^\+[1-9]\d{5,14}$/, { message: 'Некоректний формат номера телефону' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;
}
