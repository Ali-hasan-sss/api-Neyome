import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsString, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';

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
    type: Boolean,
    description:
      'Co-parent flag. `true` stores `isParent` on the user so the app opens parent screens. Sign-in is the QR link only (no PIN). Subscription changes stay with the family owner.',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsBoolean()
  isParent?: boolean;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Child age in years. **Age ≤ 6:** optional **emoji PIN** (exactly 4 characters). **Age > 6:** required **numeric PIN** (4 digits). For age ≤ 6 with `pin`, a recoverable encrypted copy is stored for `GET /auth/family-members/:childId/device-pin`.',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({
    description:
      'Device PIN. **Age > 6:** 4 digits only (e.g. `"1234"`). **Age ≤ 6:** 4-character emoji PIN (e.g. `"🌟🎈🐻🎨"`) or 4 digits. Validated in the service from `age`.',
    example: '🌟🎈🐻🎨',
  })
  @IsOptional()
  @IsString()
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
