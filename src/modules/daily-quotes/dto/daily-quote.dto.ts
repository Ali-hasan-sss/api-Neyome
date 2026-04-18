import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DailyQuoteDto {
  @ApiProperty({ example: '7E4qAsElA6XiCUEZPy4c' })
  id: string;

  @ApiPropertyOptional({ example: 'Believe in yourself. Even the smallest step matters.' })
  text?: string;

  @ApiPropertyOptional({ example: '2025-07-16T15:35:35.787Z' })
  createdAt?: Date;
}
