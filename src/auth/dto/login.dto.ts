import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

/**
 * DTO for parent user login
 */
export class LoginDto {
  @ApiProperty({
    description: 'Parent email address',
    example: 'parent@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Account password',
    example: 'securePassword123',
  })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Firebase device token. Appended to fcmTokens without replacing tokens from other devices.',
    example: 'fcm-device-token',
  })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
