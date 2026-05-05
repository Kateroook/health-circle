import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

const trimString = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

import { UUIdEntryDto } from '../../common/dto/uuid-entry.dto';

export class CreateContactDto {
  @ValidateNested()
  @Type(() => UUIdEntryDto)
  @IsNotEmpty()
  target: UUIdEntryDto;

  @IsString()
  @Transform(trimString)
  @IsNotEmpty()
  @Matches(/\p{L}/u, { message: 'Аліас має містити хоча б одну літеру' })
  @MaxLength(255)
  alias: string;
}
