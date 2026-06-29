import { IsInt, IsOptional, IsString, IsUUID, IsObject, ValidateNested, IsNumber, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocalizedFieldDto {
  @ApiPropertyOptional({ example: 'Family Pro' })
  @IsOptional()
  @IsString()
  en?: string;

  @ApiPropertyOptional({ example: 'العائلة برو' })
  @IsOptional()
  @IsString()
  ar?: string;

  @ApiPropertyOptional({ example: 'Familie Pro' })
  @IsOptional()
  @IsString()
  de?: string;
}

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID for the plan' })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({ type: LocalizedFieldDto, description: 'Plan title in all languages' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  title?: LocalizedFieldDto;

  @ApiPropertyOptional({ type: LocalizedFieldDto, description: 'Plan subtitle in all languages' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  subtitle?: LocalizedFieldDto;

  @ApiPropertyOptional({ type: LocalizedFieldDto, description: 'Badge text (e.g., Popular, Recommended)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  badge?: LocalizedFieldDto;

  @ApiPropertyOptional({ type: LocalizedFieldDto, description: 'Period short text (e.g., /month, /year)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedFieldDto)
  periodShort?: LocalizedFieldDto;

  @ApiPropertyOptional({
    description: 'Features list in all languages',
    example: {
      en: ['Up to 10 family members', 'Unlimited tasks', 'Priority support'],
      ar: ['حتى 10 أفراد من العائلة', 'مهام غير محدودة', 'دعم أولوية'],
      de: ['Bis zu 10 Familienmitglieder', 'Unbegrenzte Aufgaben', 'Prioritäts-Support']
    }
  })
  @IsOptional()
  @IsObject()
  features?: {
    en?: string[];
    ar?: string[];
    de?: string[];
  };

  @ApiPropertyOptional({ example: 9.99, description: 'Display price set by admin' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price?: number | null;

  @ApiPropertyOptional({ example: 'USD', description: 'ISO 4217 currency code' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string | null;

  @ApiPropertyOptional({ example: 1, description: 'Sort order (lower = first). Highlighted plan typically has sort=1' })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ example: 'prod_1234567890', description: 'Stripe product ID (set automatically on save)' })
  @IsOptional()
  @IsString()
  productId?: string | null;

  @ApiPropertyOptional({ example: 1, description: 'Limits version number' })
  @IsOptional()
  @IsInt()
  limitsVersion?: number;

  @ApiPropertyOptional({
    description: 'Plan limits (users, tasks, etc.)',
    example: { users: 10, tasks: 1000, rewards: 50 }
  })
  @IsOptional()
  @IsObject()
  limits?: any;
}
