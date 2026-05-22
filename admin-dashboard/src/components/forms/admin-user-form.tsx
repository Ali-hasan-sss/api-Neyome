'use client';

import { useState } from 'react';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import { useI18n } from '@/hooks/use-i18n';
import type { AdminUser } from '@/lib/types';

export type AdminUserFormValues = {
  name: string;
  email: string;
  password: string;
  locale: string;
  points: string;
  isParent: boolean;
  familyId: string;
};

export function adminUserToForm(user?: AdminUser, isCreate?: boolean): AdminUserFormValues {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    locale: user?.locale ?? 'en',
    points: String(user?.points ?? 0),
    isParent: user?.isParent ?? true,
    familyId: user?.familyId ?? '',
  };
}

export function AdminUserForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
  isCreate,
}: {
  initial: AdminUserFormValues;
  onSubmit: (values: AdminUserFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
  isCreate?: boolean;
}) {
  const { t } = useI18n();
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
      <Field label={t('users.name')}>
        <input
          className={inputClass}
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
      </Field>
      <Field label={t('users.email')}>
        <input
          type="email"
          className={inputClass}
          required
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
        />
      </Field>
      {isCreate && (
        <Field label={t('users.password')}>
          <input
            type="password"
            className={inputClass}
            required
            minLength={8}
            value={values.password}
            onChange={(e) => setValues({ ...values, password: e.target.value })}
          />
        </Field>
      )}
      <Field label={t('users.locale')}>
        <input
          className={inputClass}
          value={values.locale}
          onChange={(e) => setValues({ ...values, locale: e.target.value })}
        />
      </Field>
      {!isCreate && (
        <Field label={t('users.points')}>
          <input
            type="number"
            className={inputClass}
            value={values.points}
            onChange={(e) => setValues({ ...values, points: e.target.value })}
          />
        </Field>
      )}
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={values.isParent}
          onChange={(e) => setValues({ ...values, isParent: e.target.checked })}
          disabled={!isCreate}
          className="rounded border-slate-300"
        />
        {t('users.isParent')}
      </label>
      {isCreate && !values.isParent && (
        <Field label={t('users.familyId')}>
          <input
            className={inputClass}
            required
            value={values.familyId}
            onChange={(e) => setValues({ ...values, familyId: e.target.value })}
          />
        </Field>
      )}
      <FormActions
        onCancel={onCancel}
        loading={loading}
        submitLabel={isCreate ? t('users.add') : t('common.save')}
      />
    </form>
  );
}
