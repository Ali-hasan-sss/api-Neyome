'use client';

import { PageHeader } from '@/components/page-header';
import { useAdminFetch } from '@/hooks/use-admin-fetch';
import { useI18n } from '@/hooks/use-i18n';
import { useAuthStore } from '@/stores/auth-store';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface FamilySub {
  familyId: string;
  familyName?: string;
  familyCode?: string;
  backendPlanId: string;
  planUpdatedAt?: string;
  assignedByAdmin?: boolean;
  owner?: { name?: string; email?: string };
  memberCount: number;
}

interface PaymentItem {
  type: string;
  id: string;
  status?: string | null;
  amountPaid?: number;
  amountTotal?: number | null;
  currency?: string | null;
  customerEmail?: string | null;
  createdAt: string;
  familyId?: string | null;
  backendPlanId?: string | null;
}

export default function SubscriptionsPage() {
  const { t } = useI18n();
  const token = useAuthStore((s) => s.token);
  const { data, loading, error } = useAdminFetch<{
    items: FamilySub[];
    total: number;
  }>('/admin/subscriptions?limit=50');

  const [payments, setPayments] = useState<{
    configured: boolean;
    items: PaymentItem[];
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    apiRequest<{ configured: boolean; items: PaymentItem[]; message?: string }>(
      '/admin/billing/payments?limit=30',
      { token },
    ).then(setPayments).catch(() => setPayments({ configured: false, items: [] }));
  }, [token]);

  return (
    <div className="space-y-10">
      <PageHeader title={t('subscriptions.title')} />

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t('subscriptions.families')}</h2>
        {loading && <p className="text-slate-500">{t('common.loading')}</p>}
        {error && <p className="text-red-600">{error}</p>}
        {data && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-right">
                <tr>
                  <th className="px-4 py-3">{t('subscriptions.family')}</th>
                  <th className="px-4 py-3">{t('subscriptions.plan')}</th>
                  <th className="px-4 py-3">{t('subscriptions.owner')}</th>
                  <th className="px-4 py-3">{t('subscriptions.members')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.familyId} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div>{row.familyName ?? row.familyId}</div>
                      <div className="font-mono text-xs text-slate-400">{row.familyCode}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-600">{row.backendPlanId}</td>
                    <td className="px-4 py-3">
                      {row.owner?.name ?? '—'}
                      <div className="text-xs text-slate-400">{row.owner?.email}</div>
                    </td>
                    <td className="px-4 py-3">{row.memberCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t('subscriptions.payments')}</h2>
        {payments && !payments.configured && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t('subscriptions.stripeOff')}
          </p>
        )}
        {payments?.items && payments.items.length > 0 && (
          <div className="space-y-2">
            {payments.items.map((p) => (
              <div
                key={`${p.type}-${p.id}`}
                className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
              >
                <div>
                  <span className="font-mono text-xs text-slate-400">{p.type}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span>{p.status}</span>
                  {p.backendPlanId && (
                    <span className="mx-2 font-mono text-indigo-600">{p.backendPlanId}</span>
                  )}
                </div>
                <div className="text-slate-500">
                  {p.customerEmail} ·{' '}
                  {p.amountPaid != null
                    ? `${(p.amountPaid / 100).toFixed(2)} ${p.currency}`
                    : p.amountTotal != null
                      ? `${(p.amountTotal / 100).toFixed(2)} ${p.currency}`
                      : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
