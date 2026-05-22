'use client';

import { useState } from 'react';
import { fromLocaleMap, toLocaleMap } from '@/lib/i18n';
import { LocaleTextFields } from '@/components/ui/locale-fields';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import type { SupportFaq } from '@/lib/types';

export type FaqFormValues = {
  id: string;
  question: ReturnType<typeof fromLocaleMap>;
  answer: ReturnType<typeof fromLocaleMap>;
};

export function faqToForm(faq?: SupportFaq, newFaqId?: string): FaqFormValues {
  return {
    id: faq?.id ?? newFaqId ?? '',
    question: fromLocaleMap(faq?.question as Record<string, string>),
    answer: fromLocaleMap(faq?.answer as Record<string, string>),
  };
}

export function formToFaqPayload(values: FaqFormValues) {
  return {
    id: values.id,
    question: toLocaleMap(values.question),
    answer: toLocaleMap(values.answer),
  };
}

export function FaqForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
  isCreate,
}: {
  initial: FaqFormValues;
  onSubmit: (values: FaqFormValues) => void;
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
        <Field label="المعرّف (اختياري — يُولَّد تلقائياً إن تُرك فارغاً)">
          <input
            className={inputClass}
            value={values.id}
            onChange={(e) => setValues({ ...values, id: e.target.value })}
            placeholder="اتركه فارغاً للتوليد التلقائي"
          />
        </Field>
      )}
      <LocaleTextFields
        label="السؤال"
        values={values.question}
        onChange={(loc, v) => setValues({ ...values, question: { ...values.question, [loc]: v } })}
      />
      <LocaleTextFields
        label="الجواب"
        values={values.answer}
        onChange={(loc, v) => setValues({ ...values, answer: { ...values.answer, [loc]: v } })}
      />
      <FormActions onCancel={onCancel} loading={loading} submitLabel={isCreate ? 'إضافة سؤال' : 'حفظ التعديلات'} />
    </form>
  );
}
