'use client';

import { useState } from 'react';
import { fromLocaleContent, toLocaleContent } from '@/lib/i18n';
import { LocaleContentFields } from '@/components/ui/locale-fields';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import type { CmsPage } from '@/lib/types';

export type PageFormValues = {
  slug: string;
  type: string;
  version: string;
  locales: ReturnType<typeof fromLocaleContent>;
};

export function cmsPageToForm(page?: CmsPage): PageFormValues {
  return {
    slug: page?.type ?? '',
    type: page?.type ?? '',
    version: page?.version ?? '',
    locales: fromLocaleContent(page?.locales as Parameters<typeof fromLocaleContent>[0]),
  };
}

export function PageForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
  isCreate,
}: {
  initial: PageFormValues;
  onSubmit: (values: PageFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  isCreate?: boolean;
}) {
  const [values, setValues] = useState(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-4"
    >
      {error && <Alert message={error} />}
      {isCreate && (
        <>
          <Field label="معرّف الصفحة (slug)" hint="مثل: about_us">
            <input
              className={inputClass}
              required
              value={values.slug}
              onChange={(e) =>
                setValues({ ...values, slug: e.target.value, type: e.target.value })
              }
            />
          </Field>
        </>
      )}
      <Field label="النوع (type)">
        <input
          className={inputClass}
          value={values.type}
          onChange={(e) => setValues({ ...values, type: e.target.value })}
        />
      </Field>
      <Field label="الإصدار">
        <input
          className={inputClass}
          value={values.version}
          onChange={(e) => setValues({ ...values, version: e.target.value })}
        />
      </Field>
      <LocaleContentFields
        values={values.locales}
        onChange={(loc, field, v) =>
          setValues({
            ...values,
            locales: { ...values.locales, [loc]: { ...values.locales[loc], [field]: v } },
          })
        }
      />
      <FormActions onCancel={onCancel} loading={loading} submitLabel={isCreate ? 'إضافة صفحة' : 'حفظ'} />
    </form>
  );
}
