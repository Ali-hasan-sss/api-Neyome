'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminApi } from '@/lib/api';

interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  profileImageUrl?: string | null;
  profileImageVersion?: number;
  locale?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrateProfile: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await adminApi.login(email, password);
          set({ token: data.accessToken, user: data.user, isLoading: false });
        } catch (e) {
          set({
            isLoading: false,
            error: e instanceof Error ? e.message : 'Login failed',
          });
          throw e;
        }
      },

      logout: () => set({ token: null, user: null, error: null }),

      hydrateProfile: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const profile = await adminApi.userMe(token);
          set({
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              profileImageUrl: profile.profileImageUrl,
              locale: profile.locale,
            },
          });
        } catch {
          get().logout();
        }
      },

      setUser: (user: AuthUser) => set({ user }),
    }),
    { name: 'neyome-admin-auth' },
  ),
);
