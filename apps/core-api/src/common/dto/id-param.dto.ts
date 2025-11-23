import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDefined, IsNumber } from 'class-validator';

export class IdParamDto {
  @ApiProperty()
  @IsDefined()
  @Transform((value) => Number(value.value))
  @Type(() => Number)
  @IsNumber()
  id: number;
}
