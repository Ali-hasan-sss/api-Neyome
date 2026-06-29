'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useI18n } from '@/hooks/use-i18n';
import { resolveMediaUrl } from '@/lib/media-url';
import type { UserProfile } from '@/lib/api';

export function AdminProfileForm({
  initial,
  loading,
  error,
  success,
  avatarVersion,
  onSubmit,
}: {
  initial: UserProfile | null;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
  avatarVersion?: number;
  onSubmit: (values: { name: string; locale: string; profileImage?: File }) => void;
}) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.name ?? '');
  const [locale, setLocale] = useState(initial?.locale ?? 'ar');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();

  useEffect(() => {
    setName(initial?.name ?? '');
    setLocale(initial?.locale ?? 'ar');
    setPreview(resolveMediaUrl(initial?.profileImageUrl) ?? null);
    setSelectedFile(undefined);
  }, [initial]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), locale, profileImage: selectedFile });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 max-w-lg space-y-4 rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t('settings.profileTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('settings.profileDesc')}</p>
        {initial?.email && (
          <p className="mt-2 font-mono text-xs text-indigo-600">{initial.email}</p>
        )}
      </div>

      {error && <Alert message={error} />}
      {success && <Alert message={t('settings.profileSaved')} type="success" />}

      <div className="flex items-center gap-4">
        {preview?.startsWith('blob:') ? (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <UserAvatar
            src={initial?.profileImageUrl}
            name={name || initial?.name}
            cacheBust={avatarVersion}
          />
        )}
        <div className="flex-1">
          <Field label={t('settings.profileImage')} hint={t('settings.profileImageHint')}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif"
              className="block w-full text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={handleFileChange}
            />
          </Field>
        </div>
      </div>

      <Field label={t('settings.profileName')}>
        <input
          className={inputClass}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label={t('settings.profileLocale')}>
        <select
          className={inputClass}
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
        >
          <option value="ar">العربية</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </select>
      </Field>

      <FormActions
        onCancel={() => {
          setName(initial?.name ?? '');
          setLocale(initial?.locale ?? 'ar');
          setPreview(resolveMediaUrl(initial?.profileImageUrl) ?? null);
          setSelectedFile(undefined);
          if (fileRef.current) fileRef.current.value = '';
        }}
        loading={loading}
        submitLabel={t('settings.saveProfile')}
      />

      <p className="text-xs text-slate-400">
        API: <code className="rounded bg-slate-100 px-1">PATCH /users/me</code>
      </p>
    </form>
  );
}
