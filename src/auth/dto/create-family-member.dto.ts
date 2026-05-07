import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, Min, Max, Matches } from 'class-validator';

/**
 * DTO for creating a family member (child) account
 * Family members use auto sign-in URLs instead of email/password
 */
export class CreateFamilyMemberDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional user ID. If not provided, will be auto-generated.',
    example: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: 'Family member display name',
    example: 'Emma',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Child age in years. If age > 6, PIN is required for manual sign-in by family code. If age < 6 and `pin` is sent, a recoverable encrypted copy is stored so the parent can read it via `GET /auth/family-members/:childId/device-pin`.',
    example: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({
    description:
      '4-digit PIN (required if age > 6). Optional under 6; if provided and age < 6, stored hashed for verification and encrypted for parent recovery.',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/)
  pin?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Emoji option for avatar (1-10)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  emojiOption?: number;

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}
