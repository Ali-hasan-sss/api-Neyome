'use client';

import { useState } from 'react';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import { useI18n } from '@/hooks/use-i18n';
import { useAuthStore } from '@/stores/auth-store';

export function AdminChangePasswordForm({
  onSubmit,
  loading,
  error,
  success,
}: {
  onSubmit: (current: string, next: string) => void;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
}) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) return;
    onSubmit(current, next);
  };

  const mismatch = confirm.length > 0 && next !== confirm;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-4 rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t('settings.adminPasswordTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('settings.adminPasswordDesc')}</p>
        {user?.email && (
          <p className="mt-2 font-mono text-xs text-indigo-600">{user.email}</p>
        )}
      </div>

      {error && <Alert message={error} />}
      {success && <Alert message={t('settings.saved')} type="success" />}
      {mismatch && <Alert message={t('settings.passwordMismatch')} />}

      <Field label={t('settings.current')}>
        <input
          type="password"
          className={inputClass}
          required
          minLength={8}
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </Field>
      <Field label={t('settings.new')}>
        <input
          type="password"
          className={inputClass}
          required
          minLength={8}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <Field label={t('settings.confirm')}>
        <input
          type="password"
          className={inputClass}
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>

      <FormActions
        onCancel={() => {
          setCurrent('');
          setNext('');
          setConfirm('');
        }}
        loading={loading}
        submitLabel={t('settings.updatePassword')}
      />
    </form>
  );
}
