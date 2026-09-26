import { BillingInterval, inferBillingInterval } from './billing-period';

export type PlanStripeMeta = {
  productId?: string;
  /** Legacy single price id (pre dual-interval). */
  priceId?: string;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
};

type PlanLike = {
  price?: unknown;
  monthlyPrice?: unknown;
  yearlyPrice?: unknown;
  productId?: string | null;
  features?: {
    backendId?: string;
    billing?: string;
    stripe?: PlanStripeMeta;
  } | null;
};

export function toPriceAmount(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function toCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}

export function legacyBillingInterval(plan: PlanLike): BillingInterval {
  const billing = plan.features?.billing;
  if (billing === 'yearly' || billing === 'year' || billing === 'annual') return 'year';
  if (billing === 'monthly' || billing === 'month') return 'month';
  return inferBillingInterval(plan.features?.backendId);
}

/**
 * Monthly and yearly amounts for a plan.
 * New columns win. A legacy single `price` is mapped onto the interval
 * implied by backendId / features.billing.
 */
export function resolvePlanPrices(plan: PlanLike): { monthly: number | null; yearly: number | null } {
  const hasMonthly = plan.monthlyPrice != null && plan.monthlyPrice !== '';
  const hasYearly = plan.yearlyPrice != null && plan.yearlyPrice !== '';
  if (hasMonthly || hasYearly) {
    const monthly = hasMonthly ? toPriceAmount(plan.monthlyPrice) : null;
    const yearly = hasYearly ? toPriceAmount(plan.yearlyPrice) : null;
    return {
      monthly: monthly != null && monthly > 0 ? monthly : null,
      yearly: yearly != null && yearly > 0 ? yearly : null,
    };
  }

  const legacy = toPriceAmount(plan.price);
  if (legacy == null || legacy <= 0) return { monthly: null, yearly: null };
  return legacyBillingInterval(plan) === 'year'
    ? { monthly: null, yearly: legacy }
    : { monthly: legacy, yearly: null };
}

export function stripePriceIdForInterval(plan: PlanLike, interval: BillingInterval): string | null {
  const stripe = plan.features?.stripe;
  const legacyInterval = legacyBillingInterval(plan);
  const legacyPriceId =
    stripe?.priceId ?? (plan.productId?.startsWith('price_') ? plan.productId : undefined);

  if (interval === 'month') {
    return stripe?.monthlyPriceId ?? (legacyInterval === 'month' ? legacyPriceId ?? null : null);
  }
  return stripe?.yearlyPriceId ?? (legacyInterval === 'year' ? legacyPriceId ?? null : null);
}
