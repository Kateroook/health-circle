import { ApiProperty } from '@nestjs/swagger';

export class ActiveAlertDto {
  @ApiProperty({ example: 12345 })
  id: number;

  @ApiProperty({ example: 123456 })
  locationUid: number;

  @ApiProperty({ example: 'Львівська область' })
  regionName: string;

  @ApiProperty({ example: 'Повітряна тривога' })
  alertType: string;

  @ApiProperty({ example: 'air_raid' })
  alertTypeRaw: string;

  @ApiProperty({ example: '2026-03-30T10:15:00+00:00' })
  startedAt: string;

  @ApiProperty({ example: '2026-03-30T10:16:00+00:00' })
  updatedAt: string;
}

export class MyAlertStatusDto {
  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: 123456, nullable: true })
  userAlertRegionUid: number | null;

  @ApiProperty({ type: () => ActiveAlertDto, nullable: true })
  alert: ActiveAlertDto | null;
}
