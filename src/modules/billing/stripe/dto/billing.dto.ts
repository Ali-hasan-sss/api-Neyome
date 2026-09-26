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
    example: 'family_pro_monthly',
    description: 'Plan backendId. monthlyPrice or yearlyPrice on that plan is selected by interval.',
  })
  @IsString()
  backendPlanId: string;

  @ApiPropertyOptional({
    enum: ['month', 'year', 'monthly', 'yearly'],
    example: 'month',
    description:
      'Billing period. Omitted values are inferred from backendPlanId (_monthly / _yearly). Period end is Stripe current_period_end.',
  })
  @IsOptional()
  @IsIn(['month', 'year', 'monthly', 'yearly'])
  interval?: 'month' | 'year' | 'monthly' | 'yearly';

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
