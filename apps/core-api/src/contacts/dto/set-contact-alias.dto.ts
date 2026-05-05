import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class SetContactAliasDto {
  @IsString()
  @Transform(trimString)
  @IsNotEmpty()
  @Matches(/\p{L}/u, { message: 'Аліас має містити хоча б одну літеру' })
  @MaxLength(255)
  alias: string;
}
