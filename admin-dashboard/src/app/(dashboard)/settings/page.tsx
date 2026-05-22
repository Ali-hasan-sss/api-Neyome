'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { AdminChangePasswordForm } from '@/components/forms/admin-change-password-form';
import { useI18n } from '@/hooks/use-i18n';
import { useAuthStore } from '@/stores/auth-store';
import { apiRequest } from '@/lib/api';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function SettingsPage() {
  const { t } = useI18n();
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <div>
      <PageHeader title={t('settings.title')} description={t('settings.pageDesc')} />

      <div className="page-card page-card-padded mb-8 max-w-lg">
        <p className="mb-3 text-[0.95rem] font-medium text-slate-700">{t('settings.language')}</p>
        <LanguageSwitcher variant="light" />
      </div>

      <AdminChangePasswordForm
        loading={loading}
        error={error}
        success={success}
        onSubmit={async (current, next) => {
          if (!token) return;
          setLoading(true);
          setError(null);
          setSuccess(false);
          try {
            await apiRequest('/admin/auth/change-password', {
              method: 'POST',
              token,
              body: JSON.stringify({ currentPassword: current, newPassword: next }),
            });
            setSuccess(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed');
          } finally {
            setLoading(false);
          }
        }}
      />

      <p className="mt-6 max-w-lg text-xs text-slate-400">
        API: <code className="rounded bg-slate-100 px-1">POST /admin/auth/change-password</code>
      </p>
    </div>
  );
}
