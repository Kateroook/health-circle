import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsUUID, ValidateNested } from 'class-validator';
import { UUIdEntryDto } from 'src/common/dto/uuid-entry.dto';

import { CreateGroupDto } from './create-group.dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @IsDefined({ message: 'Поле ідентифікатора (id) є обовʼязковим' })
  @IsUUID(4, { message: 'Поле id має бути валідним UUID версії 4' })
  id: string;

  @ValidateNested({ each: true })
  @Type(() => UUIdEntryDto)
  members: UUIdEntryDto[];
}
