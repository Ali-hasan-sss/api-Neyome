import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionPlan } from '../../../entities/subscription-plan.entity';
import { BillingInterval } from './billing-period';
import { resolvePlanPrices, toCents, type PlanStripeMeta } from './plan-prices';

type PlanFeatures = Record<string, unknown> & {
  backendId?: string;
  billing?: string;
  stripe?: PlanStripeMeta;
};

@Injectable()
export class StripePlanSyncService {
  private readonly logger = new Logger(StripePlanSyncService.name);
  private readonly stripe: Stripe | null;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secretKey ? new Stripe(secretKey, { apiVersion: '2024-06-20' }) : null;
  }

  requiresStripeSync(plan: Pick<SubscriptionPlan, 'price' | 'monthlyPrice' | 'yearlyPrice' | 'features'>): boolean {
    const backendId = (plan.features as PlanFeatures | undefined)?.backendId?.trim();
    if (backendId === 'free') return false;
    const prices = resolvePlanPrices(plan);
    return prices.monthly != null || prices.yearly != null;
  }

  async syncPlan(
    plan: Pick<
      SubscriptionPlan,
      'id' | 'title' | 'price' | 'monthlyPrice' | 'yearlyPrice' | 'currency' | 'features' | 'productId'
    >,
    existing?: SubscriptionPlan,
  ): Promise<{ productId: string | null; features: PlanFeatures }> {
    const features = { ...(plan.features ?? {}) } as PlanFeatures;
    const merged = {
      ...existing,
      ...plan,
      features,
      productId: plan.productId ?? existing?.productId ?? null,
    };
    const prices = resolvePlanPrices(merged);

    if (!this.requiresStripeSync(merged)) {
      this.logger.log(`Plan ${plan.id} has no paid monthly/yearly price. Skipping Stripe sync.`);
      await this.deactivatePlanStripe(existing ?? (merged as SubscriptionPlan));
      return { productId: null, features: this.clearStripeFeatures(features) };
    }

    if (!this.stripe) {
      throw new BadRequestException('STRIPE_SECRET_KEY is not configured. Cannot save a paid subscription plan.');
    }

    const backendId = features.backendId?.trim() || plan.id;
    const productName = this.resolveProductName(plan.title, backendId);
    const currency = (plan.currency ?? existing?.currency ?? 'USD').toLowerCase();
    const existingStripe = (existing?.features as PlanFeatures | undefined)?.stripe;
    const candidateProductId =
      existingStripe?.productId ?? (merged.productId?.startsWith('prod_') ? merged.productId : undefined);

    const stripeProductId = await this.ensureProduct(candidateProductId ?? undefined, {
      name: productName,
      metadata: { planId: plan.id, backendId },
    });

    const legacyInterval = this.legacyInterval(existing);
    const monthlyPriceId = await this.syncIntervalPrice({
      amount: prices.monthly,
      interval: 'month',
      currentPriceId:
        existingStripe?.monthlyPriceId ?? (legacyInterval === 'month' ? existingStripe?.priceId : undefined),
      productId: stripeProductId,
      currency,
      metadata: { planId: plan.id, backendId, interval: 'month' },
    });
    const yearlyPriceId = await this.syncIntervalPrice({
      amount: prices.yearly,
      interval: 'year',
      currentPriceId:
        existingStripe?.yearlyPriceId ?? (legacyInterval === 'year' ? existingStripe?.priceId : undefined),
      productId: stripeProductId,
      currency,
      metadata: { planId: plan.id, backendId, interval: 'year' },
    });

    const billing =
      monthlyPriceId && yearlyPriceId ? 'both' : monthlyPriceId ? 'monthly' : yearlyPriceId ? 'yearly' : 'none';

    return {
      productId: stripeProductId,
      features: {
        ...features,
        billing,
        stripe: {
          productId: stripeProductId,
          monthlyPriceId: monthlyPriceId ?? undefined,
          yearlyPriceId: yearlyPriceId ?? undefined,
          priceId: monthlyPriceId ?? yearlyPriceId ?? undefined,
        },
      },
    };
  }

  async deactivatePlanStripe(plan?: Pick<SubscriptionPlan, 'productId' | 'features'> | null): Promise<void> {
    if (!this.stripe || !plan) return;

    const stripeMeta = (plan.features as PlanFeatures | undefined)?.stripe;
    const priceIds = [stripeMeta?.monthlyPriceId, stripeMeta?.yearlyPriceId, stripeMeta?.priceId].filter(
      (id, index, all): id is string => Boolean(id) && all.indexOf(id) === index,
    );
    for (const priceId of priceIds) {
      await this.archivePrice(priceId);
    }

    const productId =
      stripeMeta?.productId ?? (plan.productId?.startsWith('prod_') ? plan.productId : undefined);
    if (!productId) return;

    try {
      await this.stripe.products.update(productId, { active: false });
    } catch (err) {
      this.logger.warn(`Could not deactivate Stripe product ${productId}: ${err}`);
    }
  }

  private async syncIntervalPrice(params: {
    amount: number | null;
    interval: BillingInterval;
    currentPriceId?: string;
    productId: string;
    currency: string;
    metadata: Record<string, string>;
  }): Promise<string | null> {
    const { amount, interval, currentPriceId, productId, currency, metadata } = params;
    if (amount == null) {
      if (currentPriceId) await this.archivePrice(currentPriceId);
      return null;
    }

    const unitAmount = toCents(amount);
    const reusable = await this.findReusablePrice(currentPriceId, unitAmount, currency, interval);
    if (reusable) return reusable;

    if (currentPriceId) await this.archivePrice(currentPriceId);

    const price = await this.stripe!.prices.create({
      product: productId,
      unit_amount: unitAmount,
      currency,
      recurring: { interval },
      metadata,
    });

    if (currentPriceId && currentPriceId !== price.id) {
      await this.retargetSubscriptions(currentPriceId, price.id);
    }
    return price.id;
  }

  /** Keep the existing Stripe price when amount, currency, and interval are unchanged. */
  private async findReusablePrice(
    priceId: string | undefined,
    unitAmount: number,
    currency: string,
    interval: BillingInterval,
  ): Promise<string | null> {
    if (!priceId) return null;
    try {
      const price = await this.stripe!.prices.retrieve(priceId);
      const same =
        price.active &&
        price.unit_amount === unitAmount &&
        price.currency === currency &&
        price.recurring?.interval === interval;
      return same ? price.id : null;
    } catch (err) {
      if (!this.isResourceMissing(err)) throw err;
      this.logger.warn(`Stripe price ${priceId} not found. A new price will be created.`);
      return null;
    }
  }

  /**
   * Move active subscriptions onto the new price without proration and without
   * moving current_period_end. Stripe remains the source of the period dates.
   */
  private async retargetSubscriptions(oldPriceId: string, newPriceId: string): Promise<void> {
    const statuses: Stripe.SubscriptionListParams.Status[] = ['active', 'trialing', 'past_due'];
    for (const status of statuses) {
      let startingAfter: string | undefined;
      do {
        const page = await this.stripe!.subscriptions.list({
          price: oldPriceId,
          status,
          limit: 100,
          starting_after: startingAfter,
        });
        for (const sub of page.data) {
          const item = sub.items.data.find((entry) => {
            const id = typeof entry.price === 'string' ? entry.price : entry.price?.id;
            return id === oldPriceId;
          });
          if (!item) continue;
          try {
            await this.stripe!.subscriptions.update(sub.id, {
              items: [{ id: item.id, price: newPriceId }],
              proration_behavior: 'none',
            });
          } catch (err) {
            this.logger.warn(`Could not move subscription ${sub.id} to price ${newPriceId}: ${err}`);
          }
        }
        startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined;
      } while (startingAfter);
    }
  }

  private async archivePrice(priceId: string): Promise<void> {
    try {
      await this.stripe!.prices.update(priceId, { active: false });
    } catch (err) {
      if (!this.isResourceMissing(err)) {
        this.logger.warn(`Could not archive Stripe price ${priceId}: ${err}`);
      }
    }
  }

  private isResourceMissing(err: unknown): boolean {
    return (
      err instanceof Stripe.errors.StripeInvalidRequestError &&
      (err.code === 'resource_missing' || err.statusCode === 404)
    );
  }

  private async ensureProduct(
    productId: string | undefined,
    data: { name: string; metadata: Record<string, string> },
  ): Promise<string> {
    const stripe = this.stripe!;

    if (productId) {
      try {
        await stripe.products.update(productId, {
          name: data.name,
          active: true,
          metadata: data.metadata,
        });
        return productId;
      } catch (err) {
        if (!this.isResourceMissing(err)) throw err;
        this.logger.warn(`Stripe product ${productId} not found on this account. Creating a new product.`);
      }
    }

    const product = await stripe.products.create({
      name: data.name,
      metadata: data.metadata,
    });
    return product.id;
  }

  private clearStripeFeatures(features: PlanFeatures): PlanFeatures {
    const { stripe: _stripe, ...rest } = features;
    return { ...rest, billing: 'none' };
  }

  private resolveProductName(title: SubscriptionPlan['title'], fallback: string): string {
    if (title && typeof title === 'object') {
      const name = title.en || title.ar || title.de;
      if (typeof name === 'string' && name.trim()) return name.trim();
    }
    return fallback;
  }

  private legacyInterval(existing?: SubscriptionPlan): BillingInterval | null {
    if (!existing) return null;
    const features = (existing.features ?? {}) as PlanFeatures;
    if (features.billing === 'yearly') return 'year';
    if (features.billing === 'monthly') return 'month';
    const backendId = features.backendId ?? '';
    if (backendId.includes('yearly') || backendId.includes('annual')) return 'year';
    if (features.stripe?.priceId || existing.price != null) return 'month';
    return null;
  }
}
