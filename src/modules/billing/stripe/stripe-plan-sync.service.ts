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
    let stripeProductId =
      existingStripe?.productId ??
      (merged.productId?.startsWith('prod_') ? merged.productId : undefined);

    if (stripeProductId) {
      await this.stripe.products.update(stripeProductId, {
        name: productName,
        active: true,
        metadata: { planId: plan.id, backendId },
      });
    } else {
      const product = await this.stripe.products.create({
        name: productName,
        metadata: { planId: plan.id, backendId },
      });
      stripeProductId = product.id;
    }

    const priceChanged = this.hasPriceChanged(merged, existing, interval, currency, unitAmount);
    let stripePriceId = existingStripe?.priceId;

    if (!stripePriceId || priceChanged) {
      if (existingStripe?.priceId) {
        try {
          await this.stripe.prices.update(existingStripe.priceId, { active: false });
        } catch (err) {
          this.logger.warn(`Could not archive old Stripe price ${existingStripe.priceId}: ${err}`);
        }
      }

      const price = await this.stripe.prices.create({
        product: stripeProductId,
        unit_amount: unitAmount,
        currency,
        recurring: { interval },
        metadata: { planId: plan.id, backendId },
      });
      stripePriceId = price.id;
    }

    return {
      productId: stripeProductId,
      features: {
        ...features,
        stripe: { productId: stripeProductId, priceId: stripePriceId },
      },
    };
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
