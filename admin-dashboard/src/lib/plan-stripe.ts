import type { SubscriptionPlan } from '@/lib/types';

type PlanFeatures = {
  backendId?: string;
  stripe?: { productId?: string; priceId?: string };
};

export function planRequiresStripe(plan: SubscriptionPlan): boolean {
  const backendId = (plan.features as PlanFeatures | undefined)?.backendId?.trim();
  if (backendId === 'free') return false;
  const price = plan.price != null && plan.price !== '' ? Number(plan.price) : 0;
  return price > 0;
}

export function isPlanStripeIntegrated(plan: SubscriptionPlan): boolean {
  const features = (plan.features ?? {}) as PlanFeatures;
  const productId =
    features.stripe?.productId ?? (plan.productId?.startsWith('prod_') ? plan.productId : undefined);
  const priceId =
    features.stripe?.priceId ?? (plan.productId?.startsWith('price_') ? plan.productId : undefined);
  return Boolean(productId && priceId);
}
