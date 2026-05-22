'use client';

import { LOCALES, type LocaleCode, type LocaleMap } from '@/lib/i18n';
import { Field, inputClass } from './form';

const localeLabels: Record<LocaleCode, string> = {
  ar: 'العربية',
  en: 'English',
  de: 'Deutsch',
};

export function LocaleTextFields({
  label,
  values,
  onChange,
}: {
  label: string;
  values: LocaleMap;
  onChange: (loc: LocaleCode, value: string) => void;
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <legend className="px-1 text-sm font-medium text-slate-700">{label}</legend>
      {LOCALES.map((loc) => (
        <Field key={loc} label={localeLabels[loc]}>
          <input
            className={inputClass}
            value={values[loc] ?? ''}
            onChange={(e) => onChange(loc, e.target.value)}
            dir={loc === 'ar' ? 'rtl' : 'ltr'}
          />
        </Field>
      ))}
    </fieldset>
  );
}

export function LocaleContentFields({
  values,
  onChange,
}: {
  values: Record<LocaleCode, { title: string; body: string }>;
  onChange: (loc: LocaleCode, field: 'title' | 'body', value: string) => void;
}) {
  return (
    <div className="space-y-6">
      {LOCALES.map((loc) => (
        <fieldset key={loc} className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <legend className="px-1 text-sm font-semibold text-indigo-700">{localeLabels[loc]}</legend>
          <Field label="العنوان">
            <input
              className={inputClass}
              value={values[loc].title}
              onChange={(e) => onChange(loc, 'title', e.target.value)}
              dir={loc === 'ar' ? 'rtl' : 'ltr'}
            />
          </Field>
          <Field label="المحتوى">
            <textarea
              className={`${inputClass} min-h-[120px]`}
              value={values[loc].body}
              onChange={(e) => onChange(loc, 'body', e.target.value)}
              dir={loc === 'ar' ? 'rtl' : 'ltr'}
            />
          </Field>
        </fieldset>
      ))}
    </div>
  );
}
