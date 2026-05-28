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

export function LocaleArrayFields({
  label,
  values,
  onChange,
  hint,
}: {
  label: string;
  values: Record<LocaleCode, string[]>;
  onChange: (loc: LocaleCode, items: string[]) => void;
  hint?: string;
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <legend className="px-1 text-sm font-medium text-slate-700">{label}</legend>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {LOCALES.map((loc) => (
        <div key={loc} className="space-y-2">
          <p className="text-xs font-medium text-slate-600">{localeLabels[loc]}</p>
          <textarea
            className={`${inputClass}`}
            rows={5}
            defaultValue={values[loc]?.join('\n') ?? ''}
            onChange={(e) => {
              const items = e.target.value.split('\n').filter((line) => line.trim() !== '');
              onChange(loc, items);
            }}
            placeholder="أدخل كل ميزة في سطر جديد"
            dir={loc === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
      ))}
    </fieldset>
  );
}
