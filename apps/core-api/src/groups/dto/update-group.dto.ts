import { PartialType } from '@nestjs/swagger';
import { IsDefined, IsUUID } from 'class-validator';
import { CreateGroupDto } from './create-group.dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @IsDefined({ message: 'Поле ідентифікатора (id) є обовʼязковим' })
  @IsUUID(4, { message: 'Поле id має бути валідним UUID версії 4' })
  id: string;
}
