'use client';

import { useI18n } from '@/hooks/use-i18n';
import type { Locale } from '@/lib/i18n/messages';

export function LanguageSwitcher({
  className = '',
  variant = 'dark',
}: {
  className?: string;
  variant?: 'dark' | 'light';
}) {
  const { locale, setLocale, t } = useI18n();
  const inactive =
    variant === 'light'
      ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
      : 'border border-slate-600 text-slate-300 hover:bg-slate-800';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`text-xs ${variant === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
        {t('settings.language')}
      </span>
      {(['ar', 'en'] as Locale[]).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            locale === loc ? 'bg-indigo-600 text-white' : inactive
          }`}
        >
          {loc === 'ar' ? 'عربي' : 'EN'}
        </button>
      ))}
    </div>
  );
}
