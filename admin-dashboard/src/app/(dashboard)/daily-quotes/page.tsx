'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Modal } from '@/components/ui/modal';
import { RowActions } from '@/components/crud/row-actions';
import { QuoteForm, quoteToForm } from '@/components/forms/quote-form';
import { useAdminFetch } from '@/hooks/use-admin-fetch';
import { useCrudActions, newId } from '@/hooks/use-crud-actions';
import type { DailyQuote, Paginated } from '@/lib/types';

export default function DailyQuotesPage() {
  const { data, loading, error, reload } = useAdminFetch<Paginated<DailyQuote>>('/admin/daily-quotes?limit=50');
  const { saving, error: crudError, create, update, remove, clearError } = useCrudActions();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<DailyQuote | null>(null);

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    clearError();
  };

  return (
    <div>
      <PageHeader title="اقتباسات يومية">
        <button
          type="button"
          onClick={() => {
            clearError();
            setModal('create');
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + إضافة اقتباس
        </button>
      </PageHeader>

      {loading && <p className="text-slate-500">جاري التحميل...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <ul className="space-y-2">
          {data.items.map((q) => (
            <li
              key={q.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="flex-1 text-sm">{q.text}</p>
              <RowActions
                onEdit={() => {
                  clearError();
                  setSelected(q);
                  setModal('edit');
                }}
                onDelete={async () => {
                  if (!confirm('حذف هذا الاقتباس؟')) return;
                  const ok = await remove(`/admin/daily-quotes/${q.id}`);
                  if (ok) reload();
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={modal === 'create' ? 'إضافة اقتباس' : 'تعديل اقتباس'}
      >
        <QuoteForm
          key={modal === 'create' ? 'new' : selected?.id}
          initial={quoteToForm(modal === 'edit' ? selected ?? undefined : undefined, `quote_${Date.now()}`)}
          isCreate={modal === 'create'}
          loading={saving}
          error={crudError}
          onCancel={closeModal}
          onSubmit={async (values) => {
            const body = { id: values.id.trim() || `q_${newId().slice(0, 8)}`, text: values.text };
            const ok =
              modal === 'create'
                ? await create('/admin/daily-quotes', body)
                : await update(`/admin/daily-quotes/${selected!.id}`, body);
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
