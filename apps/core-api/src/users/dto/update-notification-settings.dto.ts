import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  airAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  statusUpdates?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  unknownStatusAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  statusUpdateReminders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  moodReminders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsFallover?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsSafetyStatus?: boolean;
}
