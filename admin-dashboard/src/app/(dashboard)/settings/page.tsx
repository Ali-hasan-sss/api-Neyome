'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { AdminChangePasswordForm } from '@/components/forms/admin-change-password-form';
import { AdminProfileForm } from '@/components/forms/admin-profile-form';
import { useI18n } from '@/hooks/use-i18n';
import { useAuthStore } from '@/stores/auth-store';
import { adminApi, apiRequest, type UserProfile } from '@/lib/api';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function SettingsPage() {
  const { t } = useI18n();
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    adminApi
      .userMe(token)
      .then(setProfile)
      .catch((e) => setProfileError(e instanceof Error ? e.message : 'Failed'));
  }, [token]);

  return (
    <div>
      <PageHeader title={t('settings.title')} description={t('settings.pageDesc')} />

      <AdminProfileForm
        initial={profile}
        avatarVersion={avatarVersion}
        loading={profileLoading}
        error={profileError}
        success={profileSuccess}
        onSubmit={async (values) => {
          if (!token) return;
          setProfileLoading(true);
          setProfileError(null);
          setProfileSuccess(false);
          try {
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('locale', values.locale);
            if (values.profileImage) {
              formData.append('profileImage', values.profileImage);
            }
            const updated = await adminApi.updateMe(token, formData);
            setProfile(updated);
            setAvatarVersion(Date.now());
            setUser({
              id: updated.id,
              email: updated.email,
              name: updated.name,
              profileImageUrl: updated.profileImageUrl,
              profileImageVersion: Date.now(),
              locale: updated.locale,
            });
            setProfileSuccess(true);
          } catch (e) {
            setProfileError(e instanceof Error ? e.message : 'Failed');
          } finally {
            setProfileLoading(false);
          }
        }}
      />

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
