import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiPropertyOptional()
  @Expose()
  data?: T;

  @ApiProperty({ example: '2026-02-19T08:00:00.000Z' })
  @Expose()
  timestamp: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Expose()
  requestId: string;
}

export class PaginatedResponseDto<T = unknown> extends ApiResponseDto<T[]> {
  @ApiPropertyOptional()
  @Expose()
  override data?: T[];

  @ApiProperty({
    example: { total: 100, page: 1, limit: 20, totalPages: 5 },
  })
  @Expose()
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export class VoidResponseDto {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: '2026-02-19T08:00:00.000Z' })
  @Expose()
  timestamp: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Expose()
  requestId: string;
}
