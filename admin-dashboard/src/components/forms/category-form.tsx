'use client';

import { useState } from 'react';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import type { SupportCategory } from '@/lib/types';

export type CategoryFormValues = {
  id: string;
  name_en: string;
  name_ar: string;
  name_de: string;
};

export function categoryToForm(cat?: SupportCategory, newId?: string): CategoryFormValues {
  return {
    id: cat?.id ?? newId ?? '',
    name_en: cat?.name_en ?? '',
    name_ar: cat?.name_ar ?? '',
    name_de: cat?.name_de ?? '',
  };
}

export function CategoryForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
  isCreate,
}: {
  initial: CategoryFormValues;
  onSubmit: (values: CategoryFormValues) => void;
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
        <Field label="المعرّف">
          <input
            className={inputClass}
            value={values.id}
            onChange={(e) => setValues({ ...values, id: e.target.value })}
            placeholder="اتركه فارغاً للتوليد التلقائي"
          />
        </Field>
      )}
      <Field label="الاسم (عربي)">
        <input
          className={inputClass}
          dir="rtl"
          value={values.name_ar}
          onChange={(e) => setValues({ ...values, name_ar: e.target.value })}
        />
      </Field>
      <Field label="الاسم (English)">
        <input
          className={inputClass}
          value={values.name_en}
          onChange={(e) => setValues({ ...values, name_en: e.target.value })}
        />
      </Field>
      <Field label="الاسم (Deutsch)">
        <input
          className={inputClass}
          value={values.name_de}
          onChange={(e) => setValues({ ...values, name_de: e.target.value })}
        />
      </Field>
      <FormActions onCancel={onCancel} loading={loading} submitLabel={isCreate ? 'إضافة فئة' : 'حفظ'} />
    </form>
  );
}
