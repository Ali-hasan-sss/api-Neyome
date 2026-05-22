export const SUPPORTED_LOCALES = ['en', 'ar', 'de'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'en';

function normalizeLocaleTag(tag: string): string {
  return tag.trim().toLowerCase().split('-')[0];
}

function isSupportedLocale(code: string): code is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(code);
}

/**
 * Resolves locale from `X-Locale` (preferred) or `Accept-Language`.
 */
export function resolveLocaleFromHeaders(headers: {
  'accept-language'?: string | string[];
  'x-locale'?: string | string[];
}): AppLocale {
  const xLocale = headers['x-locale'];
  if (xLocale) {
    const raw = Array.isArray(xLocale) ? xLocale[0] : xLocale;
    const code = normalizeLocaleTag(raw);
    if (isSupportedLocale(code)) return code;
  }

  const accept = headers['accept-language'];
  if (!accept) return DEFAULT_LOCALE;

  const raw = Array.isArray(accept) ? accept[0] : accept;
  const parts = raw.split(',').map((part) => normalizeLocaleTag(part.split(';')[0]));
  for (const code of parts) {
    if (isSupportedLocale(code)) return code;
  }

  return DEFAULT_LOCALE;
}

/** Pick value for locale with fallback: requested → en → first available. */
export function pickLocalizedField(
  map: Record<string, unknown> | null | undefined,
  locale: AppLocale,
): unknown {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return undefined;
  if (map[locale] !== undefined && map[locale] !== null) return map[locale];
  if (map[DEFAULT_LOCALE] !== undefined && map[DEFAULT_LOCALE] !== null) {
    return map[DEFAULT_LOCALE];
  }
  const first = Object.values(map).find((v) => v !== undefined && v !== null);
  return first;
}

export function pickLocalizedString(
  map: Record<string, unknown> | null | undefined,
  locale: AppLocale,
): string {
  const value = pickLocalizedField(map, locale);
  return typeof value === 'string' ? value : value != null ? String(value) : '';
}
