'use client';

import { LOCALES, type LocaleCode } from '@/lib/i18n';
import { Field, inputClass } from './form';
import { QuillEditor } from './quill-editor';

const localeLabels: Record<LocaleCode, string> = {
  ar: 'العربية',
  en: 'English',
  de: 'Deutsch',
};

export function LocaleRichContentFields({
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
            <QuillEditor
              value={values[loc].body}
              onChange={(v) => onChange(loc, 'body', v)}
              dir={loc === 'ar' ? 'rtl' : 'ltr'}
              placeholder="اكتب المحتوى هنا..."
              minHeight="220px"
            />
          </Field>
        </fieldset>
      ))}
    </div>
  );
}
