import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Ali' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ type: Number, example: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  })
  @IsInt()
  emojiOption?: number;
}
