'use client';

import { useEffect, useState } from 'react';
import { Alert, Field, FormActions, inputClass } from '@/components/ui/form';
import { useI18n } from '@/hooks/use-i18n';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Paginated, SubscriptionPlan } from '@/lib/types';

export function AssignPlanForm({
  userName,
  currentPlanId,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  userName: string;
  currentPlanId?: string;
  onSubmit: (backendPlanId: string) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}) {
  const { t } = useI18n();
  const token = useAuthStore((s) => s.token);
  const [plans, setPlans] = useState<{ id: string; label: string }[]>([]);
  const [backendPlanId, setBackendPlanId] = useState(currentPlanId ?? 'free');

  useEffect(() => {
    if (!token) return;
    apiRequest<Paginated<SubscriptionPlan>>('/admin/subscription-plans?limit=50', { token }).then(
      (data) => {
        setPlans(
          data.items.map((p) => ({
            id: (p.features as { backendId?: string })?.backendId ?? p.id,
            label: `${(p.features as { backendId?: string })?.backendId ?? p.id} — ${p.title?.en ?? p.title?.ar ?? ''}`,
          })),
        );
      },
    );
  }, [token]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(backendPlanId);
      }}
      className="space-y-4"
    >
      {error && <Alert message={error} />}
      <p className="text-sm text-slate-600">
        {userName}
      </p>
      <Field label={t('assignPlan.select')}>
        <select
          className={inputClass}
          value={backendPlanId}
          onChange={(e) => setBackendPlanId(e.target.value)}
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>
      <FormActions onCancel={onCancel} loading={loading} submitLabel={t('users.assignPlan')} />
    </form>
  );
}
