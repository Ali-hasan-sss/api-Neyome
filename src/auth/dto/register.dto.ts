import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO for parent user registration
 */
export class RegisterDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional user ID. If not provided, will be auto-generated.',
    example: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: 'Parent email address (used for login)',
    example: 'parent@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Account password (minimum 6 characters)',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Parent display name',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'User locale/language preference',
    example: 'en',
    default: 'en',
  })
  @IsOptional()
  @IsString()
  locale?: string;
}
