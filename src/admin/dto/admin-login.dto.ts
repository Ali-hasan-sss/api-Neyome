import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@neyome.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin123!ChangeMe', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
