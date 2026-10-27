type Limits = Record<string, unknown> | null | undefined;

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

/** First numeric limit among the given keys. Catalog plans store `members`, not `familyMembers`. */
export function readNumericLimit(limits: Limits, keys: string[]): number | null {
  if (!limits) return null;
  for (const key of keys) {
    const n = asNumber(limits[key]);
    if (n != null) return n;
  }
  return null;
}

/**
 * How many custom task types this plan allows.
 * `null` means unlimited. `0` means custom types are blocked.
 * Paid plans omit `taskTypes`; that must not be treated as the free-plan block.
 * `paid` is true when the family has an active subscription, even if limits were loaded from the free catalog.
 */
export function customTaskTypeCap(limits: Limits, backendId?: string | null, paid = false): number | null {
  const flag = limits?.taskTypes ?? limits?.customTaskTypes;
  if (flag === 'unlimited' || flag === true || flag === 'all') return null;
  if (flag === 'limited' || flag === false || flag === 'none') return 0;
  const numeric = asNumber(flag);
  if (numeric != null) return numeric <= 0 ? 0 : numeric;
  if (paid) return null;
  return (backendId?.trim() || 'free') === 'free' ? 0 : null;
}
