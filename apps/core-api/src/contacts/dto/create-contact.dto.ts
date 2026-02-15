import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { UUIdEntryDto } from '../../common/dto/uuid-entry.dto';

export class CreateContactDto {
  @ValidateNested()
  @Type(() => UUIdEntryDto)
  @IsNotEmpty()
  target: UUIdEntryDto;

  @IsString()
  @IsNotEmpty()
  alias: string;
}
