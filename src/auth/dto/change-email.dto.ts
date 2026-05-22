import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RequestEmailChangeDto {
  @ApiProperty({ example: 'newparent@example.com', description: 'New email address' })
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;
}

export class VerifyEmailChangeDto {
  @ApiProperty({ example: 'newparent@example.com' })
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP sent to the new email' })
  @IsString()
  @Length(6, 6)
  otp: string;
}
