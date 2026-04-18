import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid', example: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11' })
  id: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  name?: string;

  @ApiPropertyOptional({ example: 'parent@example.com' })
  email?: string;

  @ApiProperty({ example: true })
  isParent: boolean;

  @ApiPropertyOptional({ format: 'uuid', example: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa' })
  familyId?: string;

  @ApiPropertyOptional({ example: 'ABC123' })
  familyCode?: string;

  @ApiPropertyOptional({ example: 0 })
  points?: number;

  @ApiPropertyOptional({ example: 7 })
  age?: number;

  @ApiPropertyOptional({ example: 1 })
  emojiOption?: number;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  profileImageUrl?: string;

  @ApiPropertyOptional({ example: 'en' })
  locale?: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt?: Date;
}

export class FamilyResponseDto {
  @ApiProperty({ format: 'uuid', example: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa' })
  id: string;

  @ApiProperty({ example: 'ABC123' })
  familyCode: string;

  @ApiProperty({ example: "John Doe's Family" })
  name: string;

  @ApiProperty({ format: 'uuid', example: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11' })
  creatorId: string;

  @ApiProperty({ format: 'uuid', example: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11' })
  ownerId: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}

export class AuthTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;
}

export class RegisterResponseDataDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ type: FamilyResponseDto })
  family: FamilyResponseDto;
}

export class RegisterResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Registration successful' })
  message: string;

  @ApiProperty({ type: RegisterResponseDataDto })
  data: RegisterResponseDataDto;
}

export class LoginResponseDataDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ type: LoginResponseDataDto })
  data: LoginResponseDataDto;
}

export class CreateFamilyMemberResponseDataDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ example: 'http://localhost:3000/auth/auto-signin/a1b2c3d4e5f6...' })
  autoSignInUrl: string;
}

export class CreateFamilyMemberResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Family member created' })
  message: string;

  @ApiProperty({ type: CreateFamilyMemberResponseDataDto })
  data: CreateFamilyMemberResponseDataDto;
}

export class AutoSignInResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Sign-in successful' })
  message: string;

  @ApiProperty({ type: LoginResponseDataDto })
  data: LoginResponseDataDto;
}

export class RegenerateLinkResponseDataDto {
  @ApiProperty({ example: 'http://localhost:3000/auth/auto-signin/x9y8z7w6v5u4...' })
  autoSignInUrl: string;
}

export class RegenerateLinkResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Link regenerated' })
  message: string;

  @ApiProperty({ type: RegenerateLinkResponseDataDto })
  data: RegenerateLinkResponseDataDto;
}

export class CurrentUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'User fetched' })
  message: string;

  @ApiProperty({ type: UserResponseDto })
  data: UserResponseDto;
}

export class FamilyMembersResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Family members fetched' })
  message: string;

  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Error message' })
  message: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Password reset OTP sent to your email' })
  message: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Password reset successfully' })
  message: string;
}
