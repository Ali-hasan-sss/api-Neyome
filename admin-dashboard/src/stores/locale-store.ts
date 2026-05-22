'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/lib/i18n/messages';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'ar',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'neyome-admin-locale' },
  ),
);
