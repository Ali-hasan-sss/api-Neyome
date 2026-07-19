export type FamilyPlanStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'
  | 'free';

export interface FamilyPlanState {
  backendId: string;
  status?: FamilyPlanStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  /** ISO timestamp — synced from Stripe current_period_start */
  currentPeriodStart?: string | null;
  /** ISO timestamp — synced from Stripe current_period_end (renewal time) */
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  /** true when Stripe will renew at currentPeriodEnd (!cancelAtPeriodEnd) */
  autoRenew?: boolean;
  assignedByAdmin?: boolean;
  updatedAt?: string;
}

export const PAID_ACTIVE_STATUSES: ReadonlySet<string> = new Set(['active', 'trialing', 'past_due']);

export function isPaidActivePlan(plan?: FamilyPlanState | null): boolean {
  if (!plan?.backendId || plan.backendId === 'free') return false;
  const status = plan.status ?? 'active';
  return PAID_ACTIVE_STATUSES.has(status);
}

export function unixToIso(seconds?: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}
