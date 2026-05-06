import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateGroupDto {
  @IsString()
  @Transform(trimString)
  @IsNotEmpty({ message: 'Назва кола не може бути порожньою' })
  @Matches(/\p{L}/u, { message: 'Назва кола має містити хоча б одну літеру' })
  @MinLength(3, { message: 'Назва кола має бути не коротшою за 3 символи' })
  @MaxLength(100, { message: 'Назва кола має бути не довшою за 100 символів' })
  name: string;
}
