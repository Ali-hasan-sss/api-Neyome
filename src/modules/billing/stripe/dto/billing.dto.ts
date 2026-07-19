import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';

export class SetAutoRenewDto {
  @ApiProperty({
    example: true,
    description:
      'true = enable auto-renew at Stripe currentPeriodEnd; false = cancel at period end (no further charges)',
  })
  @IsBoolean()
  autoRenew: boolean;
}

export class CreateCheckoutSessionDto {
  @ApiProperty({
    enum: ['family_pro_monthly', 'family_pro_yearly'],
    example: 'family_pro_monthly',
  })
  @IsIn(['family_pro_monthly', 'family_pro_yearly'])
  backendPlanId: 'family_pro_monthly' | 'family_pro_yearly';

  @ApiPropertyOptional({ example: 'https://app.neyome.com/billing/success' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  successUrl?: string;

  @ApiPropertyOptional({ example: 'https://app.neyome.com/billing/cancel' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  cancelUrl?: string;
}
