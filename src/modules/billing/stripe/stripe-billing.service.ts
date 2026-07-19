import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Family } from '../../../entities/family.entity';
import { SubscriptionPlansService } from '../../subscription-plans/subscription-plans.service';
import {
  FamilyPlanState,
  FamilyPlanStatus,
  isPaidActivePlan,
  unixToIso,
} from './family-plan.types';

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

  private getPlan(family: Family): FamilyPlanState {
    const plan = (family.plan ?? {}) as FamilyPlanState;
    return {
      ...plan,
      backendId: plan.backendId || 'free',
    };
  }

  private async saveFamilyPlan(family: Family, patch: Partial<FamilyPlanState>): Promise<Family> {
    const current = this.getPlan(family);
    family.plan = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    } satisfies FamilyPlanState;
    return await this.familyRepo.save(family);
  }

  private mapStripeStatus(status: Stripe.Subscription.Status | string): FamilyPlanStatus {
    const allowed: FamilyPlanStatus[] = [
      'active',
      'trialing',
      'past_due',
      'canceled',
      'unpaid',
      'incomplete',
      'incomplete_expired',
      'paused',
    ];
    return (allowed.includes(status as FamilyPlanStatus) ? status : 'free') as FamilyPlanStatus;
  }

  private buildPlanFromStripeSubscription(
    sub: Stripe.Subscription,
    fallbackBackendId?: string,
  ): Partial<FamilyPlanState> {
    const backendPlanId =
      (sub.metadata as { backendPlanId?: string } | null)?.backendPlanId || fallbackBackendId;
    const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
    const status = this.mapStripeStatus(sub.status);
    const isActive = status === 'active' || status === 'trialing' || status === 'past_due';

    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;

    return {
      ...(backendPlanId && isActive ? { backendId: backendPlanId } : {}),
      ...(!isActive ? { backendId: 'free' } : {}),
      status: isActive ? status : status === 'canceled' ? 'canceled' : status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      currentPeriodStart: unixToIso(sub.current_period_start),
      currentPeriodEnd: unixToIso(sub.current_period_end),
      cancelAtPeriodEnd,
      autoRenew: isActive ? !cancelAtPeriodEnd : false,
    };
  }

  private async applyStripeSubscription(
    familyId: string,
    sub: Stripe.Subscription,
    fallbackBackendId?: string,
  ): Promise<void> {
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) return;

    const patch = this.buildPlanFromStripeSubscription(sub, fallbackBackendId);
    const status = patch.status;

    if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
      await this.saveFamilyPlan(family, {
        ...patch,
        backendId: 'free',
        autoRenew: false,
      });
      return;
    }

    await this.saveFamilyPlan(family, patch);
  }

  async createCheckoutSession(params: {
    familyId: string;
    backendPlanId: 'family_pro_monthly' | 'family_pro_yearly';
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{ url: string; sessionId: string }> {
    const family = await this.familyRepo.findOne({ where: { id: params.familyId } });
    if (!family) throw new NotFoundException('Family not found');

    const currentPlan = this.getPlan(family);
    if (isPaidActivePlan(currentPlan) && currentPlan.stripeSubscriptionId) {
      throw new ConflictException({
        message: 'Family already has an active subscription. Cancel or wait for it to end before starting a new one.',
        code: 'SUBSCRIPTION_ALREADY_ACTIVE',
        currentPlan: {
          backendId: currentPlan.backendId,
          status: currentPlan.status,
          currentPeriodEnd: currentPlan.currentPeriodEnd,
          autoRenew: currentPlan.autoRenew,
          stripeSubscriptionId: currentPlan.stripeSubscriptionId,
        },
      });
    }

    // Soft guard: paid plan without Stripe id (e.g. admin-assigned) still blocks a second paid checkout
    if (isPaidActivePlan(currentPlan) && currentPlan.backendId !== params.backendPlanId) {
      throw new ConflictException({
        message: 'Family already has an active paid plan. Only one subscription is allowed.',
        code: 'SUBSCRIPTION_ALREADY_ACTIVE',
        currentPlan: {
          backendId: currentPlan.backendId,
          status: currentPlan.status ?? 'active',
          currentPeriodEnd: currentPlan.currentPeriodEnd,
          autoRenew: currentPlan.autoRenew,
        },
      });
    }

    const plan = await this.subscriptionPlansService.findByBackendId(params.backendPlanId);
    if (!plan) throw new BadRequestException('Unknown plan');

    const stripePriceId = this.resolveStripePriceId(plan);
    if (!stripePriceId) {
      throw new BadRequestException('Stripe priceId is not configured for this plan');
    }

    const baseUrl = this.getBaseUrl();
    const successUrl = params.successUrl || `${baseUrl}/billing/stripe/success`;
    const cancelUrl = params.cancelUrl || `${baseUrl}/billing/stripe/cancel`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: family.id,
      // Stripe subscriptions renew automatically; cancel_at_period_end defaults to false
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
    };

    if (currentPlan.stripeCustomerId) {
      sessionParams.customer = currentPlan.stripeCustomerId;
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    if (!session.url) throw new BadRequestException('Stripe session URL was not returned');

    return { url: session.url, sessionId: session.id };
  }

  /**
   * Returns the family's active subscription enriched with plan catalog + Stripe period sync.
   * Optionally refreshes period dates from Stripe when a subscription id is stored.
   */
  async getActiveSubscription(familyId: string, options?: { refreshFromStripe?: boolean }) {
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) throw new NotFoundException('Family not found');

    let planState = this.getPlan(family);

    if (options?.refreshFromStripe !== false && planState.stripeSubscriptionId) {
      try {
        const sub = await this.stripe.subscriptions.retrieve(planState.stripeSubscriptionId);
        await this.applyStripeSubscription(familyId, sub, planState.backendId);
        const refreshed = await this.familyRepo.findOne({ where: { id: familyId } });
        if (refreshed) planState = this.getPlan(refreshed);
      } catch (err) {
        this.logger.warn(
          `Failed to refresh Stripe subscription ${planState.stripeSubscriptionId}: ${err}`,
        );
      }
    }

    const catalog = await this.subscriptionPlansService.findByBackendId(planState.backendId);
    const limits = await this.subscriptionPlansService.getLimitsByBackendId(planState.backendId);
    const isActive = planState.backendId === 'free' || isPaidActivePlan(planState);

    return {
      familyId: family.id,
      backendId: planState.backendId,
      status: planState.status ?? (planState.backendId === 'free' ? 'free' : 'active'),
      isActive,
      autoRenew: planState.autoRenew ?? false,
      cancelAtPeriodEnd: planState.cancelAtPeriodEnd ?? false,
      currentPeriodStart: planState.currentPeriodStart ?? null,
      currentPeriodEnd: planState.currentPeriodEnd ?? null,
      /** Same instant Stripe will renew / end the period */
      renewsAt: planState.autoRenew ? (planState.currentPeriodEnd ?? null) : null,
      endsAt: planState.cancelAtPeriodEnd ? (planState.currentPeriodEnd ?? null) : null,
      stripeCustomerId: planState.stripeCustomerId ?? null,
      stripeSubscriptionId: planState.stripeSubscriptionId ?? null,
      assignedByAdmin: planState.assignedByAdmin ?? false,
      updatedAt: planState.updatedAt ?? null,
      plan: catalog
        ? {
            id: catalog.id,
            title: catalog.title,
            subtitle: catalog.subtitle,
            badge: catalog.badge,
            price: catalog.price,
            currency: catalog.currency,
            periodShort: catalog.periodShort,
            features: catalog.features,
            limits: catalog.limits ?? limits,
            limitsVersion: catalog.limitsVersion,
          }
        : {
            id: null,
            title: null,
            subtitle: null,
            badge: null,
            price: null,
            currency: null,
            periodShort: null,
            features: null,
            limits,
            limitsVersion: null,
          },
    };
  }

  /**
   * Toggle Stripe auto-renewal by setting cancel_at_period_end.
   * autoRenew=true  → cancel_at_period_end=false (renew at currentPeriodEnd)
   * autoRenew=false → cancel_at_period_end=true  (end at currentPeriodEnd, no charge)
   */
  async setAutoRenew(familyId: string, autoRenew: boolean) {
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) throw new NotFoundException('Family not found');

    const planState = this.getPlan(family);
    if (!planState.stripeSubscriptionId || !isPaidActivePlan(planState)) {
      throw new BadRequestException('No active Stripe subscription to update');
    }

    const sub = await this.stripe.subscriptions.update(planState.stripeSubscriptionId, {
      cancel_at_period_end: !autoRenew,
    });

    await this.applyStripeSubscription(familyId, sub, planState.backendId);
    return this.getActiveSubscription(familyId, { refreshFromStripe: false });
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
        const familyId =
          (session.metadata as { familyId?: string } | null)?.familyId ||
          session.client_reference_id ||
          undefined;
        const backendPlanId = (session.metadata as { backendPlanId?: string } | null)?.backendPlanId;
        if (!familyId || !backendPlanId) return;

        const family = await this.familyRepo.findOne({ where: { id: familyId } });
        if (!family) return;

        // Prevent activating a second paid subscription if one is already active
        const current = this.getPlan(family);
        if (
          isPaidActivePlan(current) &&
          current.stripeSubscriptionId &&
          session.subscription &&
          String(session.subscription) !== current.stripeSubscriptionId
        ) {
          this.logger.warn(
            `Ignoring checkout for family ${familyId}: already has subscription ${current.stripeSubscriptionId}`,
          );
          try {
            const newSubId =
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription.id;
            await this.stripe.subscriptions.cancel(newSubId);
          } catch (err) {
            this.logger.warn(`Failed to cancel duplicate Stripe subscription: ${err}`);
          }
          return;
        }

        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id ?? null;

        if (subscriptionId) {
          const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
          await this.applyStripeSubscription(familyId, sub, backendPlanId);
        } else {
          await this.saveFamilyPlan(family, {
            backendId: backendPlanId,
            status: 'active',
            stripeCustomerId: customerId,
            autoRenew: true,
            cancelAtPeriodEnd: false,
          });
        }
        return;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const familyId = (sub.metadata as { familyId?: string } | null)?.familyId;
        if (!familyId) return;
        await this.applyStripeSubscription(familyId, sub);
        return;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const familyId = (sub.metadata as { familyId?: string } | null)?.familyId;
        if (!familyId) return;

        const family = await this.familyRepo.findOne({ where: { id: familyId } });
        if (!family) return;

        await this.saveFamilyPlan(family, {
          backendId: 'free',
          status: 'canceled',
          autoRenew: false,
          cancelAtPeriodEnd: false,
          currentPeriodStart: unixToIso(sub.current_period_start),
          currentPeriodEnd: unixToIso(sub.current_period_end),
          stripeSubscriptionId: null,
          stripeCustomerId:
            typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? this.getPlan(family).stripeCustomerId,
        });
        return;
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription;
        if (!subId || typeof subId !== 'string') return;
        const sub = await this.stripe.subscriptions.retrieve(subId);
        const familyId = (sub.metadata as { familyId?: string } | null)?.familyId;
        if (!familyId) return;
        // Successful renewal: sync period boundaries to Stripe's next billing cycle
        await this.applyStripeSubscription(familyId, sub);
        return;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription;
        if (!subId || typeof subId !== 'string') return;
        const sub = await this.stripe.subscriptions.retrieve(subId);
        const familyId = (sub.metadata as { familyId?: string } | null)?.familyId;
        if (!familyId) return;
        await this.applyStripeSubscription(familyId, sub);
        return;
      }

      default:
        return;
    }
  }
}
