import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionPlan } from '../../../entities/subscription-plan.entity';

type PlanFeatures = Record<string, unknown> & {
  backendId?: string;
  billing?: string;
  stripe?: { productId?: string; priceId?: string };
};

@Injectable()
export class StripePlanSyncService {
  private readonly logger = new Logger(StripePlanSyncService.name);
  private readonly stripe: Stripe | null;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secretKey ? new Stripe(secretKey, { apiVersion: '2024-06-20' }) : null;
  }

  requiresStripeSync(plan: { price?: number | null; features?: PlanFeatures }): boolean {
    const backendId = plan.features?.backendId?.trim();
    if (backendId === 'free') return false;
    const price = plan.price != null ? Number(plan.price) : 0;
    return price > 0;
  }

  async syncPlan(
    plan: Pick<SubscriptionPlan, 'id' | 'title' | 'price' | 'currency' | 'features' | 'productId'>,
    existing?: SubscriptionPlan,
  ): Promise<{ productId: string | null; features: PlanFeatures }> {
    const features = { ...(plan.features ?? {}) } as PlanFeatures;
    const merged = {
      ...plan,
      features,
      productId: plan.productId ?? existing?.productId ?? null,
    };

    if (!this.requiresStripeSync(merged)) {
      this.logger.log(`Plan ${plan.id} does not require Stripe sync (free or price=0). Skipping.`);
      return { productId: null, features: this.clearStripeFeatures(features) };
    }

    if (!this.stripe) {
      throw new BadRequestException('STRIPE_SECRET_KEY is not configured. Cannot create paid subscription plans.');
    }

    this.logger.log(`Syncing plan ${plan.id} with Stripe...`);

    const backendId = features.backendId?.trim() || plan.id;
    const productName = this.resolveProductName(plan.title, backendId);
    const interval = this.resolveBillingInterval(features);
    const currency = (plan.currency ?? 'USD').toLowerCase();
    const unitAmount = Math.round(Number(plan.price) * 100);

    const existingStripe = (existing?.features as PlanFeatures | undefined)?.stripe;
    const candidateProductId =
      existingStripe?.productId ??
      (merged.productId?.startsWith('prod_') ? merged.productId : undefined);

    const stripeProductId = await this.ensureProduct(candidateProductId, {
      name: productName,
      metadata: { planId: plan.id, backendId },
    });

    const priceChanged = this.hasPriceChanged(merged, existing, interval, currency, unitAmount);

    const stripePriceId = await this.ensurePrice({
      currentPriceId: existingStripe?.priceId,
      productId: stripeProductId,
      unitAmount,
      currency,
      interval,
      forceNew: priceChanged,
      metadata: { planId: plan.id, backendId },
    });

    return {
      productId: stripeProductId,
      features: {
        ...features,
        stripe: { productId: stripeProductId, priceId: stripePriceId },
      },
    };
  }

  private isResourceMissing(err: unknown): boolean {
    return (
      err instanceof Stripe.errors.StripeInvalidRequestError &&
      (err.code === 'resource_missing' || err.statusCode === 404)
    );
  }

  /** Update the product if it exists; otherwise create a new one (handles stale/foreign product ids). */
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
        this.logger.warn(
          `Stripe product ${productId} not found on this account. Creating a new product.`,
        );
      }
    }

    const product = await stripe.products.create({
      name: data.name,
      metadata: data.metadata,
    });
    return product.id;
  }

  /** Reuse the existing price when valid; otherwise archive it (best-effort) and create a fresh one. */
  private async ensurePrice(params: {
    currentPriceId?: string;
    productId: string;
    unitAmount: number;
    currency: string;
    interval: 'month' | 'year';
    forceNew: boolean;
    metadata: Record<string, string>;
  }): Promise<string> {
    const stripe = this.stripe!;
    const { currentPriceId, productId, unitAmount, currency, interval, forceNew, metadata } = params;

    if (currentPriceId && !forceNew) {
      try {
        const price = await stripe.prices.retrieve(currentPriceId);
        if (price.active) return currentPriceId;
      } catch (err) {
        if (!this.isResourceMissing(err)) throw err;
        this.logger.warn(`Stripe price ${currentPriceId} not found. Creating a new price.`);
      }
    } else if (currentPriceId && forceNew) {
      try {
        await stripe.prices.update(currentPriceId, { active: false });
      } catch (err) {
        this.logger.warn(`Could not archive old Stripe price ${currentPriceId}: ${err}`);
      }
    }

    const price = await stripe.prices.create({
      product: productId,
      unit_amount: unitAmount,
      currency,
      recurring: { interval },
      metadata,
    });
    return price.id;
  }

  async deactivatePlanStripe(plan: SubscriptionPlan): Promise<void> {
    if (!this.stripe) return;

    const stripeMeta = (plan.features as PlanFeatures | undefined)?.stripe;
    const productId =
      stripeMeta?.productId ?? (plan.productId?.startsWith('prod_') ? plan.productId : undefined);
    if (!productId) return;

    try {
      await this.stripe.products.update(productId, { active: false });
    } catch (err) {
      this.logger.warn(`Could not deactivate Stripe product ${productId}: ${err}`);
    }
  }

  private clearStripeFeatures(features: PlanFeatures): PlanFeatures {
    const { stripe: _stripe, ...rest } = features;
    return rest;
  }

  private resolveProductName(title: SubscriptionPlan['title'], fallback: string): string {
    if (title && typeof title === 'object') {
      const name = title.en || title.ar || title.de;
      if (typeof name === 'string' && name.trim()) return name.trim();
    }
    return fallback;
  }

  private resolveBillingInterval(features: PlanFeatures): 'month' | 'year' {
    if (features.billing === 'yearly') return 'year';
    if (features.billing === 'monthly') return 'month';
    const backendId = features.backendId ?? '';
    if (backendId.includes('yearly') || backendId.includes('annual')) return 'year';
    return 'month';
  }

  private hasPriceChanged(
    plan: Pick<SubscriptionPlan, 'price' | 'currency' | 'features'>,
    existing: SubscriptionPlan | undefined,
    interval: 'month' | 'year',
    currency: string,
    unitAmount: number,
  ): boolean {
    if (!existing) return true;

    const existingPrice = existing.price != null ? Math.round(Number(existing.price) * 100) : 0;
    const existingCurrency = (existing.currency ?? 'USD').toLowerCase();
    const existingInterval = this.resolveBillingInterval((existing.features ?? {}) as PlanFeatures);

    return (
      existingPrice !== unitAmount ||
      existingCurrency !== currency ||
      existingInterval !== interval ||
      !(existing.features as PlanFeatures | undefined)?.stripe?.priceId
    );
  }
}
