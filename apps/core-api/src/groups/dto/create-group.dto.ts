import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Назва кола не може бути порожньою' })
  @MinLength(3, { message: 'Назва кола має бути не коротшою за 3 символи' })
  @MaxLength(100, { message: 'Назва кола має бути не довшою за 100 символів' })
  name: string;
}
