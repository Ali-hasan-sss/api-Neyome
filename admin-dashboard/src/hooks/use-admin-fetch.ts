'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiRequest } from '@/lib/api';

export function useAdminFetch<T>(path: string, deps: unknown[] = []) {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<T>(path, { token });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [path, token]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, ...deps]);

  return { data, error, loading, reload, token };
}
