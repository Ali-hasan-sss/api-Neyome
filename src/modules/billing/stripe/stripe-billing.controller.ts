import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiForbiddenResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { ParentGuard } from '../../../auth/parent.guard';
import { StripeBillingService } from './stripe-billing.service';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ParentGuard)
@Controller('billing/stripe')
export class StripeBillingController {
  constructor(private readonly stripeBillingService: StripeBillingService) {}

  @Post('checkout-session')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['backendPlanId'],
      properties: {
        backendPlanId: {
          type: 'string',
          enum: ['family_pro_monthly', 'family_pro_yearly'],
          example: 'family_pro_monthly',
        },
        successUrl: {
          type: 'string',
          example: 'https://app.neyome.com/billing/success',
        },
        cancelUrl: {
          type: 'string',
          example: 'https://app.neyome.com/billing/cancel',
        },
      },
    },
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Stripe checkout session created' },
        data: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              example: 'https://checkout.stripe.com/c/pay/cs_test_123',
            },
            sessionId: {
              type: 'string',
              example: 'cs_test_123',
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiBadRequestResponse({ description: 'Invalid plan or Stripe not configured' })
  async createCheckoutSession(
    @Request() req: any,
    @Body()
    body: {
      backendPlanId: 'family_pro_monthly' | 'family_pro_yearly';
      successUrl?: string;
      cancelUrl?: string;
    },
  ) {
    const familyId = req.user.familyId;
    const data = await this.stripeBillingService.createCheckoutSession({
      familyId,
      backendPlanId: body.backendPlanId,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });

    return { success: true, data, message: 'Stripe checkout session created' };
  }
}
