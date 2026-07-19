import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { ParentGuard } from '../../../auth/parent.guard';
import { CreateCheckoutSessionDto, SetAutoRenewDto } from './dto/billing.dto';
import { StripeBillingService } from './stripe-billing.service';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing/stripe')
export class StripeBillingController {
  constructor(private readonly stripeBillingService: StripeBillingService) {}

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get active subscription',
    description: `
Returns the authenticated user's **family active subscription** for the mobile app.

Includes plan catalog details, Stripe status, auto-renew flag, and billing period dates
synced from Stripe (\`currentPeriodStart\` / \`currentPeriodEnd\` / \`renewsAt\`).

- Works for parent and family members (any JWT user with a family).
- Pass \`refresh=false\` to skip a live Stripe refresh and read DB only.
    `,
  })
  @ApiQuery({
    name: 'refresh',
    required: false,
    type: Boolean,
    description: 'Refresh period dates from Stripe (default: true)',
  })
  @ApiOkResponse({
    description: 'Active subscription for the user family',
    schema: {
      example: {
        success: true,
        message: 'Active subscription fetched',
        data: {
          familyId: 'b1111111-2222-3333-4444-555555555555',
          backendId: 'family_pro_monthly',
          status: 'active',
          isActive: true,
          autoRenew: true,
          cancelAtPeriodEnd: false,
          currentPeriodStart: '2026-07-19T10:00:00.000Z',
          currentPeriodEnd: '2026-08-19T10:00:00.000Z',
          renewsAt: '2026-08-19T10:00:00.000Z',
          endsAt: null,
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          assignedByAdmin: false,
          updatedAt: '2026-07-19T10:05:00.000Z',
          plan: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: { en: 'Family Pro', ar: 'العائلة برو' },
            price: 9.99,
            currency: 'USD',
            periodShort: { en: '/month', ar: '/شهر' },
            limits: { familyMembers: 10 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getActiveSubscription(@Request() req: any, @Query('refresh') refresh?: string) {
    const familyId = req.user.familyId;
    if (!familyId) {
      return {
        success: true,
        data: null,
        message: 'User has no family',
      };
    }

    const refreshFromStripe = refresh === undefined ? true : refresh !== 'false' && refresh !== '0';
    const data = await this.stripeBillingService.getActiveSubscription(familyId, {
      refreshFromStripe,
    });

    return { success: true, data, message: 'Active subscription fetched' };
  }

  @Patch('subscription/auto-renew')
  @UseGuards(JwtAuthGuard, ParentGuard)
  @ApiOperation({
    summary: 'Enable / disable auto-renewal',
    description: `
Mobile endpoint for the **parent** to toggle automatic plan renewal.

- \`autoRenew: true\` → Stripe renews at \`currentPeriodEnd\` (same Stripe billing instant).
- \`autoRenew: false\` → subscription stays active until \`currentPeriodEnd\`, then ends (no further charge).

Requires an existing active Stripe subscription. Returns the updated subscription object.
    `,
  })
  @ApiBody({ type: SetAutoRenewDto })
  @ApiOkResponse({
    description: 'Auto-renew flag updated; returns full subscription payload',
    schema: {
      example: {
        success: true,
        message: 'Auto-renew enabled',
        data: {
          familyId: 'b1111111-2222-3333-4444-555555555555',
          backendId: 'family_pro_monthly',
          status: 'active',
          isActive: true,
          autoRenew: true,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: '2026-08-19T10:00:00.000Z',
          renewsAt: '2026-08-19T10:00:00.000Z',
          endsAt: null,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiBadRequestResponse({ description: 'No active Stripe subscription, or invalid body' })
  async setAutoRenew(@Request() req: any, @Body() body: SetAutoRenewDto) {
    if (typeof body?.autoRenew !== 'boolean') {
      throw new BadRequestException('autoRenew (boolean) is required');
    }

    const data = await this.stripeBillingService.setAutoRenew(req.user.familyId, body.autoRenew);
    return {
      success: true,
      data,
      message: body.autoRenew ? 'Auto-renew enabled' : 'Auto-renew disabled; ends at period end',
    };
  }

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard, ParentGuard)
  @ApiOperation({
    summary: 'Create Stripe checkout session',
    description: `
Creates a Stripe Checkout Session (subscription mode) for the parent family.

- Only **one** active paid subscription per family is allowed (409 if already subscribed).
- After payment, webhooks activate the plan and sync period dates from Stripe.
- Open \`data.url\` in the mobile browser / WebView to complete payment.
    `,
  })
  @ApiBody({ type: CreateCheckoutSessionDto })
  @ApiOkResponse({
    description: 'Checkout session created — open the returned URL',
    schema: {
      example: {
        success: true,
        message: 'Stripe checkout session created',
        data: {
          url: 'https://checkout.stripe.com/c/pay/cs_test_123',
          sessionId: 'cs_test_123',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiBadRequestResponse({ description: 'Invalid plan or Stripe not configured' })
  @ApiConflictResponse({ description: 'Family already has an active subscription' })
  async createCheckoutSession(@Request() req: any, @Body() body: CreateCheckoutSessionDto) {
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
