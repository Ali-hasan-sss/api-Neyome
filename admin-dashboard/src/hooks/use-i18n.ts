'use client';

import { useCallback, useEffect } from 'react';
import { messages, type Locale } from '@/lib/i18n/messages';
import { useLocaleStore } from '@/stores/locale-store';

export function useI18n() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const t = useCallback(
    (key: string) => messages[locale][key] ?? messages.en[key] ?? key,
    [locale],
  );

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return { t, locale, setLocale, dir };
}
