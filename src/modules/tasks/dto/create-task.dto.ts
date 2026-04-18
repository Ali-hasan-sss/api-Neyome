import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ format: 'uuid', example: 'f5b3d0b8-aaaa-bbbb-cccc-000000000001' })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({ example: 'Do homework' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ type: Boolean, example: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({ example: 'pending' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: Number, example: 10 })
  @IsOptional()
  @IsInt()
  points?: number;

  @ApiPropertyOptional({ example: 'Asia/Riyadh' })
  @IsOptional()
  @IsString()
  tz?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '2025-01-01T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ format: 'uuid', example: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa' })
  @IsOptional()
  @IsUUID()
  familyId?: string;

  @ApiPropertyOptional({ format: 'uuid', example: '7c6b9f0e-2222-3333-4444-bbbbbbbbbbbb' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
