import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'parent@example.com',
    description: 'Email address of the user requesting password reset',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
