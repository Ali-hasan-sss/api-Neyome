import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiPropertyOptional({ format: 'uuid' })
  id?: string;

  @ApiPropertyOptional({ example: 'Ali' })
  name?: string;

  @ApiPropertyOptional({ example: 'ali@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/uploads/avatars/uuid.webp' })
  profileImageUrl?: string | null;

  @ApiPropertyOptional({ example: 'ar' })
  locale?: string;

  @ApiPropertyOptional({ example: 1 })
  emojiOption?: number;

  @ApiPropertyOptional({ example: true })
  isParent?: boolean;

  @ApiPropertyOptional({ example: false })
  isAdmin?: boolean;
}
