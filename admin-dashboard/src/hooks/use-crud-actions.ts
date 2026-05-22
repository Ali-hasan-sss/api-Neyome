'use client';

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiRequest } from '@/lib/api';

export function useCrudActions() {
  const token = useAuthStore((s) => s.token);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async <T,>(path: string, body: unknown): Promise<T | null> => {
      if (!token) return null;
      setSaving(true);
      setError(null);
      try {
        return await apiRequest<T>(path, { method: 'POST', token, body: JSON.stringify(body) });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'فشل الإنشاء');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [token],
  );

  const update = useCallback(
    async <T,>(path: string, body: unknown): Promise<T | null> => {
      if (!token) return null;
      setSaving(true);
      setError(null);
      try {
        return await apiRequest<T>(path, { method: 'PATCH', token, body: JSON.stringify(body) });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'فشل التحديث');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [token],
  );

  const remove = useCallback(
    async (path: string): Promise<boolean> => {
      if (!token) return false;
      setSaving(true);
      setError(null);
      try {
        await apiRequest(path, { method: 'DELETE', token });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'فشل الحذف');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [token],
  );

  const clearError = useCallback(() => setError(null), []);

  return { token, saving, error, create, update, remove, clearError };
}

export function newId() {
  return crypto.randomUUID();
}
