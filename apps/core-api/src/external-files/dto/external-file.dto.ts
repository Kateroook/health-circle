import { ApiProperty } from '@nestjs/swagger';

export class ExternalFileDto {
  @ApiProperty({ example: 1 })
  id?: number;

  @ApiProperty({ example: 'avatar.png', description: 'Original file name' })
  fileName: string;

  @ApiProperty({ example: 'uuid-external-123', description: 'Unique external identifier' })
  externalId: string;

  @ApiProperty({ example: 'd41d8cd98f00b204e9800998ecf8427e', description: 'MD5 hash of the file' })
  md5: string;

  @ApiProperty({ example: 24567, description: 'File size in bytes' })
  size: number;

  @ApiProperty({ example: 'application/pdf', nullable: true, description: 'MIME type of the file' })
  mimetype?: string;

  @ApiProperty({ example: '2025-12-01T00:00:00Z', nullable: true, description: 'Optional unlink date' })
  unlinkAt?: Date;

  @ApiProperty({ example: '2025-10-01T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-01T11:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  deletedAt?: Date | null;
}
