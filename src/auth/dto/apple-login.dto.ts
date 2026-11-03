import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Apple identity token from Sign in with Apple (Flutter).
 * The token audience must be the iOS bundle id or the Apple Services id.
 */
export class AppleLoginDto {
  @ApiProperty({
    description:
      'Identity token JWT from Sign in with Apple. Verified against Apple public keys. Audience must match APPLE_CLIENT_IDS.',
    example: 'eyJraWQiOiJXNldjT0tCIiwiYWxnIjoiUlMyNTYifQ...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiPropertyOptional({
    description: 'Name from the Apple credential. Apple sends this to the app only on the first authorization, not inside the token.',
    example: 'Sara Ali',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Firebase device token. Appended to fcmTokens without replacing tokens from other devices.',
    example: 'fcm-device-token',
  })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
