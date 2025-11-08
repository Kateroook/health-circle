import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Поле email має бути валідною електронною адресою' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Поле firstName має бути рядком' })
  firstName: string;

  @IsOptional()
  @IsString({ message: 'Поле middleName має бути рядком' })
  middleName: string;

  @IsOptional()
  @IsString({ message: 'Поле lastName має бути рядком' })
  lastName: string;
}
