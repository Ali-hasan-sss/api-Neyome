'use client';

import { useState } from 'react';
import { fromLocaleMap, toLocaleMap, type LocaleCode } from '@/lib/i18n';
import { LocaleTextFields, LocaleArrayFields } from '@/components/ui/locale-fields';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import type { SubscriptionPlan } from '@/lib/types';

export type PlanFormValues = {
  backendId: string;
  sort: string;
  monthlyPrice: string;
  yearlyPrice: string;
  currency: string;
  limitsVersion: string;
  members: string;
  rewardsPerDay: string;
  tasksPerDay: string;
  title: ReturnType<typeof fromLocaleMap>;
  subtitle: ReturnType<typeof fromLocaleMap>;
  periodShort: ReturnType<typeof fromLocaleMap>;
  badge: ReturnType<typeof fromLocaleMap>;
  features: Record<LocaleCode, string[]>;
  stripeProductId?: string;
  stripeMonthlyPriceId?: string;
  stripeYearlyPriceId?: string;
};

export function planToForm(plan?: SubscriptionPlan): PlanFormValues {
  const limits = (plan?.limits ?? {}) as Record<string, number>;
  const features = (plan?.features ?? {}) as {
    backendId?: string;
    billing?: string;
    stripe?: { productId?: string; priceId?: string; monthlyPriceId?: string; yearlyPriceId?: string };
    en?: string[];
    ar?: string[];
    de?: string[];
  };
  const yearlyLegacy =
    features.billing === 'yearly' || /yearly|annual/i.test(features.backendId ?? '');
  const legacyPrice = plan?.price != null && plan.price !== '' ? String(plan.price) : '';
  const stripeProductId =
    features.stripe?.productId ?? (plan?.productId?.startsWith('prod_') ? plan.productId : undefined);
  const stripeMonthlyPriceId =
    features.stripe?.monthlyPriceId ??
    (!yearlyLegacy ? features.stripe?.priceId ?? (plan?.productId?.startsWith('price_') ? plan.productId : undefined) : undefined);
  const stripeYearlyPriceId =
    features.stripe?.yearlyPriceId ?? (yearlyLegacy ? features.stripe?.priceId : undefined);
  return {
    backendId: features.backendId ?? '',
    sort: String(plan?.sort ?? ''),
    monthlyPrice:
      plan?.monthlyPrice != null && plan.monthlyPrice !== ''
        ? String(plan.monthlyPrice)
        : !yearlyLegacy
          ? legacyPrice
          : '',
    yearlyPrice:
      plan?.yearlyPrice != null && plan.yearlyPrice !== ''
        ? String(plan.yearlyPrice)
        : yearlyLegacy
          ? legacyPrice
          : '',
    currency: plan?.currency ?? 'USD',
    limitsVersion: String(plan?.limitsVersion ?? 1),
    members: String(limits.members ?? ''),
    rewardsPerDay: String(limits.rewardsPerDay ?? ''),
    tasksPerDay: String(limits.tasksPerDay ?? ''),
    title: fromLocaleMap(plan?.title as Record<string, string>),
    subtitle: fromLocaleMap(plan?.subtitle as Record<string, string>),
    periodShort: fromLocaleMap(plan?.periodShort as Record<string, string>),
    badge: fromLocaleMap(plan?.badge as Record<string, string>),
    features: {
      en: features.en ?? [],
      ar: features.ar ?? [],
      de: features.de ?? [],
    },
    stripeProductId,
    stripeMonthlyPriceId,
    stripeYearlyPriceId,
  };
}

export function formToPlanPayload(values: PlanFormValues, id: string) {
  const limits: Record<string, number> = {};
  if (values.members) limits.members = Number(values.members);
  if (values.rewardsPerDay) limits.rewardsPerDay = Number(values.rewardsPerDay);
  if (values.tasksPerDay) limits.tasksPerDay = Number(values.tasksPerDay);

  const monthly = values.monthlyPrice !== '' ? Number(values.monthlyPrice) : null;
  const yearly = values.yearlyPrice !== '' ? Number(values.yearlyPrice) : null;
  const features: Record<string, any> = {
    backendId: values.backendId.trim() || undefined,
    billing: monthly && yearly ? 'both' : monthly ? 'monthly' : yearly ? 'yearly' : 'none',
  };

  // Add localized features if any exist
  if (values.features.en?.length || values.features.ar?.length || values.features.de?.length) {
    features.en = values.features.en;
    features.ar = values.features.ar;
    features.de = values.features.de;
  }

  return {
    id,
    sort: values.sort ? Number(values.sort) : undefined,
    monthlyPrice: monthly,
    yearlyPrice: yearly,
    price: monthly ?? yearly,
    currency: values.currency.trim().toUpperCase() || 'USD',
    limitsVersion: values.limitsVersion ? Number(values.limitsVersion) : undefined,
    limits: Object.keys(limits).length ? limits : undefined,
    title: toLocaleMap(values.title),
    subtitle: toLocaleMap(values.subtitle),
    periodShort: toLocaleMap(values.periodShort),
    badge: toLocaleMap(values.badge),
    features,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter from submitting form in input fields
    // Allow Enter to work normally in textarea
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      onKeyDown={handleKeyDown}
      className="space-y-4"
    >
      {error && <Alert message={error} />}
      <Field label="معرّف الخطة (backendId)" hint="مثل: free أو family_pro. الفترة تُحدد بسعر الشهر وسعر السنة، لا باسم المعرّف">
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
        {!isCreate && (values.stripeProductId || values.stripeMonthlyPriceId || values.stripeYearlyPriceId) && (
          <Field label="Stripe" hint="يُحدَّث تلقائياً عند حفظ السعر">
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600">
              {values.stripeProductId && <p>Product: {values.stripeProductId}</p>}
              {values.stripeMonthlyPriceId && <p>Monthly: {values.stripeMonthlyPriceId}</p>}
              {values.stripeYearlyPriceId && <p>Yearly: {values.stripeYearlyPriceId}</p>}
            </div>
          </Field>
        )}
      </div>
      {(Number(values.monthlyPrice) > 0 || Number(values.yearlyPrice) > 0) && values.backendId !== 'free' && (
        <p className="text-sm text-slate-600">
          حفظ الخطة ينشئ أو يحدّث سعر الشهر وسعر السنة في Stripe. الاشتراكات الحالية تنتقل للسعر الجديد دون تغيير تاريخ انتهاء الفترة.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="السعر الشهري" hint="فارغ = لا توجد فترة شهرية">
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={values.monthlyPrice}
            onChange={(e) => setValues({ ...values, monthlyPrice: e.target.value })}
          />
        </Field>
        <Field label="السعر السنوي" hint="فارغ = لا توجد فترة سنوية">
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={values.yearlyPrice}
            onChange={(e) => setValues({ ...values, yearlyPrice: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="العملة" hint="مثل: USD, EUR, SAR">
          <input
            className={inputClass}
            maxLength={3}
            value={values.currency}
            onChange={(e) => setValues({ ...values, currency: e.target.value.toUpperCase() })}
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
      <LocaleArrayFields
        label="المميزات"
        values={values.features}
        onChange={(loc, items) => setValues({ ...values, features: { ...values.features, [loc]: items } })}
        hint="أدخل كل ميزة في سطر جديد"
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
