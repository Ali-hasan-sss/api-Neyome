'use client';

import { useState } from 'react';
import { fromLocaleContent, toLocaleContent } from '@/lib/i18n';
import { LocaleRichContentFields } from '@/components/ui/locale-rich-content-fields';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import type { CmsPage } from '@/lib/types';

export type LegalFormValues = {
  version: string;
  locales: ReturnType<typeof fromLocaleContent>;
};

export function pageToLegalForm(page: CmsPage): LegalFormValues {
  return {
    version: page.version ?? '',
    locales: fromLocaleContent(page.locales as Parameters<typeof fromLocaleContent>[0]),
  };
}

export function LegalPageForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial: LegalFormValues;
  onSubmit: (values: LegalFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [values, setValues] = useState(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      {error && <Alert message={error} />}
      <Field label="إصدار المحتوى">
        <input
          className={inputClass}
          value={values.version}
          onChange={(e) => setValues({ ...values, version: e.target.value })}
          placeholder="2025-09-24"
        />
      </Field>
      <div className="mt-4">
        <LocaleRichContentFields
          values={values.locales}
          onChange={(loc, field, v) =>
            setValues({
              ...values,
              locales: {
                ...values.locales,
                [loc]: { ...values.locales[loc], [field]: v },
              },
            })
          }
        />
      </div>
      <FormActions onCancel={onCancel} loading={loading} />
    </form>
  );
}

export function legalFormToPayload(values: LegalFormValues) {
  return {
    version: values.version || undefined,
    locales: toLocaleContent(values.locales),
  };
}
