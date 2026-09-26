import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCreateUserDto {
  @ApiProperty({ example: 'parent@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Ali Parent' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isParent?: boolean;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ description: 'Required when creating a child user' })
  @IsOptional()
  @IsUUID()
  familyId?: string;
}

export class AdminAssignFamilyPlanDto {
  @ApiProperty({ example: 'family_pro_monthly' })
  @IsString()
  backendPlanId: string;

  @ApiPropertyOptional({
    enum: ['month', 'year', 'monthly', 'yearly'],
    example: 'month',
    description: 'Billing period. The end date uses Stripe calendar month/year rules.',
  })
  @IsOptional()
  @IsIn(['month', 'year', 'monthly', 'yearly'])
  interval?: 'month' | 'year' | 'monthly' | 'yearly';
}
