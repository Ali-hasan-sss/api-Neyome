'use client';

import { useState } from 'react';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import type { SupportRequest } from '@/lib/types';

export type RequestFormValues = {
  name: string;
  email: string;
  message: string;
  categoryName: string;
};

export function requestToForm(r: SupportRequest): RequestFormValues {
  return {
    name: r.name ?? '',
    email: r.email ?? '',
    message: r.message ?? '',
    categoryName: r.categoryName ?? '',
  };
}

export function SupportRequestForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial: RequestFormValues;
  onSubmit: (values: RequestFormValues) => void;
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
      className="space-y-4"
    >
      {error && <Alert message={error} />}
      <Field label="الاسم">
        <input
          className={inputClass}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
      </Field>
      <Field label="البريد">
        <input
          type="email"
          className={inputClass}
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
        />
      </Field>
      <Field label="الفئة">
        <input
          className={inputClass}
          value={values.categoryName}
          onChange={(e) => setValues({ ...values, categoryName: e.target.value })}
        />
      </Field>
      <Field label="الرسالة">
        <textarea
          className={`${inputClass} min-h-[120px]`}
          value={values.message}
          onChange={(e) => setValues({ ...values, message: e.target.value })}
        />
      </Field>
      <FormActions onCancel={onCancel} loading={loading} />
    </form>
  );
}
