import { IsDefined, IsUUID } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class ModifyUserDto extends PartialType(CreateUserDto) {
  @IsDefined({ message: 'Поле ідентифікатора (id) є обовʼязковим' })
  @IsUUID(4, { message: 'Поле id має бути валідним UUID версії 4' })
  id: string;
}
