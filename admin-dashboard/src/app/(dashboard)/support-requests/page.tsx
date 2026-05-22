'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Modal } from '@/components/ui/modal';
import { RowActions } from '@/components/crud/row-actions';
import { SupportRequestForm, requestToForm } from '@/components/forms/support-request-form';
import { useAdminFetch } from '@/hooks/use-admin-fetch';
import { useCrudActions } from '@/hooks/use-crud-actions';
import type { Paginated, SupportRequest } from '@/lib/types';

export default function SupportRequestsPage() {
  const { data, loading, error, reload } = useAdminFetch<Paginated<SupportRequest>>(
    '/admin/support-requests?limit=50',
  );
  const { saving, error: crudError, update, remove, clearError } = useCrudActions();
  const [selected, setSelected] = useState<SupportRequest | null>(null);

  return (
    <div>
      <PageHeader title="طلبات الدعم" description="عرض وتعديل وحذف طلبات الدعم الواردة" />

      {loading && <p className="text-slate-500">جاري التحميل...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="space-y-3">
          {data.items.map((r) => (
            <article
              key={r.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{r.email}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{r.message}</p>
                <p className="mt-1 text-xs text-slate-400">{r.categoryName}</p>
              </div>
              <RowActions
                onEdit={() => {
                  clearError();
                  setSelected(r);
                }}
                onDelete={async () => {
                  if (!confirm('حذف هذا الطلب؟')) return;
                  const ok = await remove(`/admin/support-requests/${r.id}`);
                  if (ok) reload();
                }}
              />
            </article>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="تعديل طلب دعم" wide>
        {selected && (
          <SupportRequestForm
            initial={requestToForm(selected)}
            loading={saving}
            error={crudError}
            onCancel={() => setSelected(null)}
            onSubmit={async (values) => {
              const ok = await update(`/admin/support-requests/${selected.id}`, values);
              if (ok) {
                setSelected(null);
                reload();
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
}
