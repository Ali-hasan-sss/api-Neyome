import { Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiBadRequestResponse, ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../auth/public.decorator';
import { StripeBillingService } from './stripe-billing.service';

@ApiTags('Billing')
@Controller('billing/stripe')
export class StripeWebhookController {
  constructor(private readonly stripeBillingService: StripeBillingService) {}

  @Public()
  @Post('webhook')
  @ApiHeader({
    name: 'stripe-signature',
    required: true,
    description: 'Stripe webhook signature header used to verify the request',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Webhook received' },
        data: {
          type: 'object',
          properties: {
            received: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid signature, missing rawBody, or webhook secret not configured' })
  async webhook(@Req() req: any, @Headers('stripe-signature') stripeSignature?: string) {
    const rawBody = req.rawBody as Buffer | undefined;
    if (!rawBody) {
      return {
        success: false,
        message:
          'Missing rawBody. Ensure main.ts uses raw body for /billing/stripe/webhook before JSON parsing.',
        data: null,
      };
    }

    const event = this.stripeBillingService.verifyWebhookSignature(rawBody, stripeSignature);
    await this.stripeBillingService.handleWebhookEvent(event);

    return { success: true, data: { received: true }, message: 'Webhook received' };
  }
}
