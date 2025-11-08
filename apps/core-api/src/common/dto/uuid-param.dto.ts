import { Transform, Type } from 'class-transformer';
import { IsDefined, IsUUID } from 'class-validator';

export class UUIdParamDto {
  @IsDefined()
  @Transform((value) => String(value.value))
  @Type(() => String)
  @IsUUID(4)
  id: string;
}
