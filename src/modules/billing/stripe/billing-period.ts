/**
 * Stripe bills monthly and yearly plans on a calendar cycle, not a fixed
 * 30-day or 365-day window.
 *
 * - month: same UTC day next month, or the last day of that month when the
 *   anchor day does not exist (31 Jan → 28/29 Feb).
 * - year: same UTC month and day next year, or 28 Feb when the anchor is
 *   29 Feb and the next year is not a leap year.
 *
 * The time of day is preserved. This matches Stripe's current_period_end
 * for interval month/year so a locally activated plan expires at the same
 * instant Stripe would end that period.
 */
export type BillingInterval = 'month' | 'year';

export function addStripeBillingPeriod(start: Date, interval: BillingInterval, count = 1): Date {
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth();
  const day = start.getUTCDate();

  let targetYear = year;
  let targetMonth = month;
  if (interval === 'month') {
    const absolute = month + count;
    targetYear += Math.floor(absolute / 12);
    targetMonth = ((absolute % 12) + 12) % 12;
  } else {
    targetYear += count;
  }

  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDay);

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
      start.getUTCHours(),
      start.getUTCMinutes(),
      start.getUTCSeconds(),
      start.getUTCMilliseconds(),
    ),
  );
}

export function normalizeBillingInterval(value?: string | null): BillingInterval | null {
  const raw = (value ?? '').trim().toLowerCase();
  if (raw === 'year' || raw === 'yearly' || raw === 'annual') return 'year';
  if (raw === 'month' || raw === 'monthly') return 'month';
  return null;
}

/** Infer month/year from an explicit interval, otherwise from a backend id such as family_pro_yearly. */
export function inferBillingInterval(backendId?: string | null, explicit?: string | null): BillingInterval {
  return normalizeBillingInterval(explicit) ?? (/(yearly|annual)/i.test(backendId ?? '') ? 'year' : 'month');
}
