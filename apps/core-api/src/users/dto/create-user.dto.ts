import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsOptional, IsPhoneNumber, IsString, Validate } from 'class-validator';
import { UserUniqueConstraint } from 'src/common/constraints/user-unique.constraint';

export class CreateUserDto {
  @IsDefined({ message: 'Поле електронної пошти є обовʼязковим' })
  @IsEmail({}, { message: 'Некоректний формат електронної пошти' })
  @Validate(UserUniqueConstraint, ['email'], { message: 'Електронна пошта вже використовується іншим користувачем' })
  email: string;

  @IsDefined({ message: 'Поле імені є обовʼязковим' })
  @IsString({ message: 'Імʼя має бути рядком' })
  firstName: string;

  @IsOptional()
  @IsString({ message: 'По-батькові має бути рядком' })
  middleName: string;

  @IsDefined({ message: 'Поле прізвища є обовʼязковим' })
  @IsString({ message: 'Прізвище має бути рядком' })
  lastName: string;

  @ApiProperty({ example: '+380922022491' })
  @IsDefined({ message: 'Поле номера телефону є обовʼязковим' })
  @IsString()
  @IsPhoneNumber('UA', { message: 'Некоректний формат номера телефону' })
  @Validate(UserUniqueConstraint, ['phone'], { message: 'Номер телефону вже використовується іншим користувачем' })
  phone: string;
}
