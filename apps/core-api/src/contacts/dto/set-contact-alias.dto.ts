import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SetContactAliasDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alias?: string;
}
