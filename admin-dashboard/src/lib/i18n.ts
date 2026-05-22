export type LocaleCode = 'en' | 'ar' | 'de';
export const LOCALES: LocaleCode[] = ['ar', 'en', 'de'];

export type LocaleMap = Partial<Record<LocaleCode, string>>;

export function fromLocaleMap(map?: Record<string, string> | null): LocaleMap {
  if (!map) return {};
  return { en: map.en, ar: map.ar, de: map.de };
}

export function toLocaleMap(fields: LocaleMap): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const loc of LOCALES) {
    const v = fields[loc]?.trim();
    if (v) out[loc] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export type LocaleContentMap = Partial<Record<LocaleCode, { title?: string; body?: string }>>;

export function fromLocaleContent(map?: LocaleContentMap | null) {
  const result: Record<LocaleCode, { title: string; body: string }> = {
    ar: { title: '', body: '' },
    en: { title: '', body: '' },
    de: { title: '', body: '' },
  };
  for (const loc of LOCALES) {
    result[loc] = {
      title: map?.[loc]?.title ?? '',
      body: map?.[loc]?.body ?? '',
    };
  }
  return result;
}

export function toLocaleContent(fields: ReturnType<typeof fromLocaleContent>): LocaleContentMap {
  const out: LocaleContentMap = {};
  for (const loc of LOCALES) {
    const title = fields[loc].title.trim();
    const body = fields[loc].body.trim();
    if (title || body) out[loc] = { title, body };
  }
  return out;
}
