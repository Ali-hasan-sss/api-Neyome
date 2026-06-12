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
    '/admin/subscription-plans?limit=50&sortBy=sort&sortOrder=ASC',
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

  const getFeatures = (plan: SubscriptionPlan, locale: string = 'ar') => {
    const features = plan.features as { en?: string[]; ar?: string[]; de?: string[] } || {};
    return features[locale as keyof typeof features] || features.en || [];
  };

  const getLocalizedText = (field: any, locale: string = 'ar') => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[locale] || field.en || '';
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    if (plan.price == null || plan.price === '') return 'مجاني';
    const amount = Number(plan.price);
    if (Number.isNaN(amount)) return '—';
    return `${amount} ${(plan.currency ?? 'USD').toUpperCase()}`;
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((plan) => {
            const isHighlight = plan.sort === 1;
            const title = getLocalizedText(plan.title);
            const subtitle = getLocalizedText(plan.subtitle);
            const badge = getLocalizedText(plan.badge);
            const features = getFeatures(plan);
            const periodShort = getLocalizedText(plan.periodShort);

            return (
              <div
                key={plan.id}
                className={[
                  'relative rounded-2xl p-6 transition-all duration-300',
                  isHighlight
                    ? 'shadow-xl text-white bg-gradient-to-br from-violet-600 to-cyan-500'
                    : 'bg-white/70 backdrop-blur shadow-md border border-slate-200',
                ].join(' ')}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold">{title || '—'}</h3>
                  {badge && (
                    <span
                      className={[
                        'ms-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                        isHighlight ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-600',
                      ].join(' ')}
                    >
                      {badge}
                    </span>
                  )}
                </div>

                {/* Subtitle */}
                {subtitle && (
                  <p className={`text-sm mb-2 ${isHighlight ? 'text-white/80' : 'text-gray-600'}`}>
                    {subtitle}
                  </p>
                )}

                <p className={`text-2xl font-bold mb-4 ${isHighlight ? 'text-white' : 'text-violet-700'}`}>
                  {formatPrice(plan)}
                  {periodShort && (
                    <span className={`ms-1 text-sm font-medium ${isHighlight ? 'text-white/80' : 'text-gray-500'}`}>
                      / {periodShort}
                    </span>
                  )}
                </p>

                {/* Features */}
                <ul
                  className={`mt-5 space-y-2 text-sm leading-6 ${
                    isHighlight ? 'text-white/90' : 'text-gray-700'
                  }`}
                >
                  {features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span aria-hidden className="mt-1">✅</span>
                      <span className="text-start">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer with actions */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs opacity-70">
                    <span className="font-mono">
                      {(plan.features as { backendId?: string })?.backendId || plan.id}
                    </span>
                    {periodShort && <span className="ms-2">{periodShort}</span>}
                  </div>
                  <RowActions
                    onEdit={() => {
                      clearError();
                      setSelected(plan);
                      setModal('edit');
                    }}
                    onDelete={() => handleDelete(plan)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modal !== null}
        title={modal === 'create' ? 'إضافة خطة اشتراك' : 'تعديل خطة'}
        onClose={closeModal}
        wide
      >
        <PlanForm
          key={modal === 'create' ? 'create' : `edit-${selected?.id}`}
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
