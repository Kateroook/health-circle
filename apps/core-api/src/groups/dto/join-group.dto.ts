import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Код кола не може бути порожнім' })
  @Length(6, 6, { message: 'Код кола має бути 6 символів' })  
  code: string;
}
