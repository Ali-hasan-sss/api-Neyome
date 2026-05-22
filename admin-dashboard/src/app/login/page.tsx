'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useI18n } from '@/hooks/use-i18n';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function LoginPage() {
  const router = useRouter();
  const { t, dir } = useI18n();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch {
      /* store */
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-100 p-6"
      dir={dir}
    >
      <div className="absolute top-4 end-4">
        <LanguageSwitcher variant="light" />
      </div>
      <form
        onSubmit={onSubmit}
        className="page-card w-full max-w-md p-8 shadow-xl shadow-slate-300/30"
      >
        <p className="text-[0.75rem] font-semibold uppercase tracking-widest text-indigo-600">{t('app.brand')}</p>
        <h1 className="mt-2 text-[1.65rem] font-semibold text-slate-900">{t('login.title')}</h1>
        <p className="mt-1 text-[0.95rem] text-slate-500">{t('login.subtitle')}</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">{t('login.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">{t('login.password')}</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? t('login.loading') : t('login.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
