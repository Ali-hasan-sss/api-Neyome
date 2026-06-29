import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Family } from '../../../entities/family.entity';
import { SubscriptionPlansService } from '../../subscription-plans/subscription-plans.service';

@Injectable()
export class StripeBillingService {
  private readonly logger = new Logger(StripeBillingService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    private readonly subscriptionPlansService: SubscriptionPlansService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY is not set. Stripe billing endpoints will fail until configured.');
    }

    this.stripe = new Stripe(secretKey || 'missing', {
      apiVersion: '2024-06-20',
    });
  }

  private resolveStripePriceId(plan: { productId?: string | null; features?: unknown }): string | null {
    const stripeMeta = (plan.features as { stripe?: { priceId?: string } } | undefined)?.stripe;
    if (stripeMeta?.priceId) return stripeMeta.priceId;
    if (plan.productId?.startsWith('price_')) return plan.productId;
    return null;
  }

  private getBaseUrl(): string {
    return (
      this.configService.get<string>('APP_BASE_URL') ||
      this.configService.get<string>('BASE_URL') ||
      'http://localhost:3000'
    );
  }

  async createCheckoutSession(params: {
    familyId: string;
    backendPlanId: 'family_pro_monthly' | 'family_pro_yearly';
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{ url: string; sessionId: string }> {
    const family = await this.familyRepo.findOne({ where: { id: params.familyId } });
    if (!family) throw new NotFoundException('Family not found');

    const plan = await this.subscriptionPlansService.findByBackendId(params.backendPlanId);
    if (!plan) throw new BadRequestException('Unknown plan');

    const stripePriceId = this.resolveStripePriceId(plan);
    if (!stripePriceId) {
      throw new BadRequestException('Stripe priceId is not configured for this plan');
    }

    const baseUrl = this.getBaseUrl();
    const successUrl = params.successUrl || `${baseUrl}/billing/stripe/success`;
    const cancelUrl = params.cancelUrl || `${baseUrl}/billing/stripe/cancel`;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: family.id,
      subscription_data: {
        metadata: {
          familyId: family.id,
          backendPlanId: params.backendPlanId,
        },
      },
      metadata: {
        familyId: family.id,
        backendPlanId: params.backendPlanId,
      },
    });

    if (!session.url) throw new BadRequestException('Stripe session URL was not returned');

    return { url: session.url, sessionId: session.id };
  }

  verifyWebhookSignature(rawBody: Buffer, signatureHeader?: string | string[]): Stripe.Event {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const sig = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!sig) throw new BadRequestException('Missing Stripe-Signature header');

    return this.stripe.webhooks.constructEvent(rawBody, sig, secret);
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const familyId = (session.metadata as any)?.familyId || session.client_reference_id;
        const backendPlanId = (session.metadata as any)?.backendPlanId;
        if (!familyId || !backendPlanId) return;
        await this.setFamilyPlanBackendId(familyId, backendPlanId);
        return;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const familyId = (sub.metadata as any)?.familyId;
        const backendPlanId = (sub.metadata as any)?.backendPlanId;
        if (!familyId) return;

        if (sub.status === 'active' || sub.status === 'trialing') {
          if (backendPlanId) {
            await this.setFamilyPlanBackendId(familyId, backendPlanId);
          }
          return;
        }

        if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
          await this.setFamilyPlanBackendId(familyId, 'free');
        }
        return;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const familyId = (sub.metadata as any)?.familyId;
        if (!familyId) return;
        await this.setFamilyPlanBackendId(familyId, 'free');
        return;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription;
        if (!subId || typeof subId !== 'string') return;
        const sub = await this.stripe.subscriptions.retrieve(subId);
        const familyId = (sub.metadata as any)?.familyId;
        if (!familyId) return;
        if (sub.status !== 'active' && sub.status !== 'trialing') {
          await this.setFamilyPlanBackendId(familyId, 'free');
        }
        return;
      }

      default:
        return;
    }
  }

  private async setFamilyPlanBackendId(familyId: string, backendId: string): Promise<void> {
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) return;

    family.plan = {
      ...(family.plan || {}),
      backendId,
      updatedAt: new Date().toISOString(),
    };

    await this.familyRepo.save(family);
  }
}
