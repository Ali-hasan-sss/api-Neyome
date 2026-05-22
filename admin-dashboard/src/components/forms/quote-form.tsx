'use client';

import { useState } from 'react';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import type { DailyQuote } from '@/lib/types';

export type QuoteFormValues = { id: string; text: string };

export function quoteToForm(q?: DailyQuote, newId?: string): QuoteFormValues {
  return { id: q?.id ?? newId ?? '', text: q?.text ?? '' };
}

export function QuoteForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
  isCreate,
}: {
  initial: QuoteFormValues;
  onSubmit: (values: QuoteFormValues) => void;
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
            placeholder="معرّف نصي فريد"
          />
        </Field>
      )}
      <Field label="نص الاقتباس">
        <textarea
          className={`${inputClass} min-h-[100px]`}
          required
          value={values.text}
          onChange={(e) => setValues({ ...values, text: e.target.value })}
        />
      </Field>
      <FormActions onCancel={onCancel} loading={loading} submitLabel={isCreate ? 'إضافة' : 'حفظ'} />
    </form>
  );
}
