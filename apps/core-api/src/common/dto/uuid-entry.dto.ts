import { Transform } from 'class-transformer';
import { IsDefined, IsUUID } from 'class-validator';

export class UUIdEntryDto {
  @IsDefined({ message: 'Поле є обовʼязковим' })
  @IsUUID(4, { message: 'Поле має бути валідним UUID v4' })
  @Transform((obj) => String(obj.value))
  id: string;
}
