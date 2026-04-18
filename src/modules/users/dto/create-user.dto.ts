import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ format: 'uuid', example: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11' })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({ type: Boolean, example: true })
  @IsOptional()
  @IsBoolean()
  isParent?: boolean;

  @ApiPropertyOptional({ example: 'Ali' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'ali@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @IsInt()
  emojiOption?: number;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiPropertyOptional({ type: Number, example: 0 })
  @IsOptional()
  @IsInt()
  points?: number;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ example: 'ABC123' })
  @IsOptional()
  @IsString()
  familyCode?: string;

  @ApiPropertyOptional({ format: 'uuid', example: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa' })
  @IsOptional()
  @IsUUID()
  familyId?: string;
}
