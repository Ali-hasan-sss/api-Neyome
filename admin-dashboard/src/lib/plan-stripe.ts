import type { SubscriptionPlan } from '@/lib/types';

type PlanFeatures = {
  backendId?: string;
  billing?: string;
  stripe?: { productId?: string; priceId?: string; monthlyPriceId?: string; yearlyPriceId?: string };
};

function amount(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function planPricePair(plan: SubscriptionPlan): { monthly: number | null; yearly: number | null } {
  const monthly = amount(plan.monthlyPrice);
  const yearly = amount(plan.yearlyPrice);
  if ((plan.monthlyPrice != null && plan.monthlyPrice !== '') || (plan.yearlyPrice != null && plan.yearlyPrice !== '')) {
    return {
      monthly: monthly != null && monthly > 0 ? monthly : null,
      yearly: yearly != null && yearly > 0 ? yearly : null,
    };
  }
  const legacy = amount(plan.price);
  if (legacy == null || legacy <= 0) return { monthly: null, yearly: null };
  const features = (plan.features ?? {}) as PlanFeatures;
  const yearlyLegacy =
    features.billing === 'yearly' || /yearly|annual/i.test(features.backendId ?? '');
  return yearlyLegacy ? { monthly: null, yearly: legacy } : { monthly: legacy, yearly: null };
}

export function planRequiresStripe(plan: SubscriptionPlan): boolean {
  const backendId = (plan.features as PlanFeatures | undefined)?.backendId?.trim();
  if (backendId === 'free') return false;
  const prices = planPricePair(plan);
  return prices.monthly != null || prices.yearly != null;
}

export function isPlanStripeIntegrated(plan: SubscriptionPlan): boolean {
  const prices = planPricePair(plan);
  if (!prices.monthly && !prices.yearly) return false;
  const features = (plan.features ?? {}) as PlanFeatures;
  const stripe = features.stripe;
  const productId =
    stripe?.productId ?? (plan.productId?.startsWith('prod_') ? plan.productId : undefined);
  if (!productId) return false;

  const legacyInterval =
    features.billing === 'yearly' || /yearly|annual/i.test(features.backendId ?? '') ? 'year' : 'month';
  const legacyPriceId =
    stripe?.priceId ?? (plan.productId?.startsWith('price_') ? plan.productId : undefined);

  if (prices.monthly && !(stripe?.monthlyPriceId || (legacyInterval === 'month' ? legacyPriceId : undefined))) {
    return false;
  }
  if (prices.yearly && !(stripe?.yearlyPriceId || (legacyInterval === 'year' ? legacyPriceId : undefined))) {
    return false;
  }
  return true;
}
