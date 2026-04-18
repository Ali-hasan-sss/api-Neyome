import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

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
}
