'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Modal } from '@/components/ui/modal';
import { RowActions } from '@/components/crud/row-actions';
import { PlanForm, formToPlanPayload, planToForm } from '@/components/forms/plan-form';
import { useAdminFetch } from '@/hooks/use-admin-fetch';
import { useCrudActions } from '@/hooks/use-crud-actions';
import { stableUuidSync } from '@/lib/stable-id';
import type { Paginated, SubscriptionPlan } from '@/lib/types';

type ModalMode = 'create' | 'edit' | null;

export default function PlansPage() {
  const { data, loading, error, reload } = useAdminFetch<Paginated<SubscriptionPlan>>(
    '/admin/subscription-plans?limit=50',
  );
  const { saving, error: crudError, create, update, remove, clearError } = useCrudActions();
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    clearError();
  };

  const handleDelete = async (plan: SubscriptionPlan) => {
    if (!confirm(`حذف الخطة "${(plan.features as { backendId?: string })?.backendId ?? plan.id}"؟`)) return;
    const ok = await remove(`/admin/subscription-plans/${plan.id}`);
    if (ok) reload();
  };

  return (
    <div>
      <PageHeader title="خطط الاشتراك" description="إضافة وتعديل وحذف خطط الأسعار">
        <button
          type="button"
          onClick={() => {
            clearError();
            setSelected(null);
            setModal('create');
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + إضافة خطة
        </button>
      </PageHeader>

      {loading && <p className="text-slate-500">جاري التحميل...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="space-y-3">
          {data.items.map((plan) => (
            <article
              key={plan.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="font-mono text-xs text-indigo-600">
                  {(plan.features as { backendId?: string })?.backendId ?? plan.id}
                </p>
                <h2 className="mt-1 font-semibold">{plan.title?.ar ?? plan.title?.en ?? '—'}</h2>
                <p className="text-sm text-slate-500">ترتيب: {plan.sort ?? '—'}</p>
              </div>
              <RowActions
                onEdit={() => {
                  clearError();
                  setSelected(plan);
                  setModal('edit');
                }}
                onDelete={() => handleDelete(plan)}
              />
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modal !== null}
        title={modal === 'create' ? 'إضافة خطة اشتراك' : 'تعديل خطة'}
        onClose={closeModal}
        wide
      >
        <PlanForm
          key={modal === 'create' ? 'new' : selected?.id}
          initial={planToForm(modal === 'edit' ? selected ?? undefined : undefined)}
          isCreate={modal === 'create'}
          loading={saving}
          error={crudError}
          onCancel={closeModal}
          onSubmit={async (values) => {
            const id =
              modal === 'edit' && selected
                ? selected.id
                : stableUuidSync('subscription_plan', values.backendId.trim());
            const payload = formToPlanPayload(values, id);
            const ok =
              modal === 'create'
                ? await create('/admin/subscription-plans', payload)
                : await update(`/admin/subscription-plans/${selected!.id}`, payload);
            if (ok) {
              closeModal();
              reload();
            }
          }}
        />
      </Modal>
    </div>
  );
}
