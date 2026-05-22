'use client';

import { useState } from 'react';
import { fromLocaleMap, toLocaleMap } from '@/lib/i18n';
import { LocaleTextFields } from '@/components/ui/locale-fields';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import type { SubscriptionPlan } from '@/lib/types';

export type PlanFormValues = {
  backendId: string;
  sort: string;
  productId: string;
  limitsVersion: string;
  members: string;
  rewardsPerDay: string;
  tasksPerDay: string;
  title: ReturnType<typeof fromLocaleMap>;
  subtitle: ReturnType<typeof fromLocaleMap>;
  periodShort: ReturnType<typeof fromLocaleMap>;
  badge: ReturnType<typeof fromLocaleMap>;
};

export function planToForm(plan?: SubscriptionPlan): PlanFormValues {
  const limits = (plan?.limits ?? {}) as Record<string, number>;
  const features = (plan?.features ?? {}) as { backendId?: string };
  return {
    backendId: features.backendId ?? '',
    sort: String(plan?.sort ?? ''),
    productId: plan?.productId ?? '',
    limitsVersion: String(plan?.limitsVersion ?? 1),
    members: String(limits.members ?? ''),
    rewardsPerDay: String(limits.rewardsPerDay ?? ''),
    tasksPerDay: String(limits.tasksPerDay ?? ''),
    title: fromLocaleMap(plan?.title as Record<string, string>),
    subtitle: fromLocaleMap(plan?.subtitle as Record<string, string>),
    periodShort: fromLocaleMap(plan?.periodShort as Record<string, string>),
    badge: fromLocaleMap(plan?.badge as Record<string, string>),
  };
}

export function formToPlanPayload(values: PlanFormValues, id: string) {
  const limits: Record<string, number> = {};
  if (values.members) limits.members = Number(values.members);
  if (values.rewardsPerDay) limits.rewardsPerDay = Number(values.rewardsPerDay);
  if (values.tasksPerDay) limits.tasksPerDay = Number(values.tasksPerDay);

  return {
    id,
    sort: values.sort ? Number(values.sort) : undefined,
    productId: values.productId || null,
    limitsVersion: values.limitsVersion ? Number(values.limitsVersion) : undefined,
    limits: Object.keys(limits).length ? limits : undefined,
    title: toLocaleMap(values.title),
    subtitle: toLocaleMap(values.subtitle),
    periodShort: toLocaleMap(values.periodShort),
    badge: toLocaleMap(values.badge),
    features: {
      backendId: values.backendId.trim() || undefined,
      billing: values.backendId.includes('yearly') ? 'yearly' : values.backendId.includes('monthly') ? 'monthly' : 'none',
    },
  };
}

export function PlanForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
  isCreate,
}: {
  initial: PlanFormValues;
  onSubmit: (values: PlanFormValues) => void;
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
      <Field label="معرّف الخطة (backendId)" hint="مثل: free أو family_pro_monthly">
        <input
          className={inputClass}
          required={isCreate}
          value={values.backendId}
          onChange={(e) => setValues({ ...values, backendId: e.target.value })}
          disabled={!isCreate}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الترتيب (sort)">
          <input
            type="number"
            className={inputClass}
            value={values.sort}
            onChange={(e) => setValues({ ...values, sort: e.target.value })}
          />
        </Field>
        <Field label="productId">
          <input
            className={inputClass}
            value={values.productId}
            onChange={(e) => setValues({ ...values, productId: e.target.value })}
          />
        </Field>
      </div>
      <LocaleTextFields
        label="العنوان"
        values={values.title}
        onChange={(loc, v) => setValues({ ...values, title: { ...values.title, [loc]: v } })}
      />
      <LocaleTextFields
        label="الوصف الفرعي"
        values={values.subtitle}
        onChange={(loc, v) => setValues({ ...values, subtitle: { ...values.subtitle, [loc]: v } })}
      />
      <LocaleTextFields
        label="الفترة"
        values={values.periodShort}
        onChange={(loc, v) => setValues({ ...values, periodShort: { ...values.periodShort, [loc]: v } })}
      />
      <LocaleTextFields
        label="الشارة"
        values={values.badge}
        onChange={(loc, v) => setValues({ ...values, badge: { ...values.badge, [loc]: v } })}
      />
      <fieldset className="grid gap-3 rounded-xl border border-slate-100 p-4 sm:grid-cols-3">
        <legend className="px-1 text-sm font-medium text-slate-700">الحدود (limits)</legend>
        <Field label="الأعضاء">
          <input
            type="number"
            className={inputClass}
            value={values.members}
            onChange={(e) => setValues({ ...values, members: e.target.value })}
          />
        </Field>
        <Field label="مكافآت/يوم">
          <input
            type="number"
            className={inputClass}
            value={values.rewardsPerDay}
            onChange={(e) => setValues({ ...values, rewardsPerDay: e.target.value })}
          />
        </Field>
        <Field label="مهام/يوم">
          <input
            type="number"
            className={inputClass}
            value={values.tasksPerDay}
            onChange={(e) => setValues({ ...values, tasksPerDay: e.target.value })}
          />
        </Field>
      </fieldset>
      <FormActions onCancel={onCancel} loading={loading} submitLabel={isCreate ? 'إضافة الخطة' : 'حفظ التعديلات'} />
    </form>
  );
}
