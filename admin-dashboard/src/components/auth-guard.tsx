'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hydrateProfile = useAuthStore((s) => s.hydrateProfile);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    hydrateProfile();
  }, [token, router, hydrateProfile]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        جاري التحقق...
      </div>
    );
  }

  return <>{children}</>;
}
