import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsPhoneNumber, IsString } from 'class-validator';

export class CreateUserDto {
  @IsDefined({ message: 'Поле електронної пошти є обовʼязковим' })
  @IsEmail({}, { message: 'Некоректний формат електронної пошти' })
  email: string;

  @IsDefined({ message: 'Поле імені є обовʼязковим' })
  @IsString({ message: 'Імʼя має бути рядком' })
  firstName: string;

  @IsDefined({ message: 'Поле по-батькові є обовʼязковим' })
  @IsString({ message: 'По-батькові має бути рядком' })
  middleName: string;

  @IsDefined({ message: 'Поле прізвища є обовʼязковим' })
  @IsString({ message: 'Прізвище має бути рядком' })
  lastName: string;

  @ApiProperty({ example: '+380922022491' })
  @IsDefined({ message: 'Поле номера телефону є обовʼязковим' })
  @IsString()
  @IsPhoneNumber('UA', { message: 'Некоректний формат номера телефону' })
  phone: string;
}
