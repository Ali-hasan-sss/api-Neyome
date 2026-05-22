'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Modal } from '@/components/ui/modal';
import { RowActions } from '@/components/crud/row-actions';
import { FaqForm, faqToForm, formToFaqPayload } from '@/components/forms/faq-form';
import { useAdminFetch } from '@/hooks/use-admin-fetch';
import { useCrudActions, newId } from '@/hooks/use-crud-actions';
import type { Paginated, SupportFaq } from '@/lib/types';

export default function FaqsPage() {
  const { data, loading, error, reload } = useAdminFetch<Paginated<SupportFaq>>('/admin/support-faqs?limit=50');
  const { saving, error: crudError, create, update, remove, clearError } = useCrudActions();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<SupportFaq | null>(null);

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    clearError();
  };

  return (
    <div>
      <PageHeader title="الأسئلة الشائعة">
        <button
          type="button"
          onClick={() => {
            clearError();
            setModal('create');
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + إضافة سؤال
        </button>
      </PageHeader>

      {loading && <p className="text-slate-500">جاري التحميل...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="space-y-3">
          {data.items.map((faq) => (
            <article
              key={faq.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{faq.question?.ar ?? faq.question?.en ?? '—'}</h3>
                <p className="mt-2 text-sm text-slate-600">{faq.answer?.ar ?? faq.answer?.en ?? '—'}</p>
              </div>
              <RowActions
                onEdit={() => {
                  clearError();
                  setSelected(faq);
                  setModal('edit');
                }}
                onDelete={async () => {
                  if (!confirm('حذف هذا السؤال؟')) return;
                  const ok = await remove(`/admin/support-faqs/${faq.id}`);
                  if (ok) reload();
                }}
              />
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={modal === 'create' ? 'إضافة سؤال' : 'تعديل سؤال'}
        wide
      >
        <FaqForm
          key={modal === 'create' ? 'new' : selected?.id}
          initial={faqToForm(modal === 'edit' ? selected ?? undefined : undefined, newId())}
          isCreate={modal === 'create'}
          loading={saving}
          error={crudError}
          onCancel={closeModal}
          onSubmit={async (values) => {
            const ok =
              modal === 'create'
                ? await create(
                    '/admin/support-faqs',
                    formToFaqPayload({ ...values, id: values.id.trim() || newId() }),
                  )
                : await update(
                    `/admin/support-faqs/${selected!.id}`,
                    (({ id: _id, ...rest }) => rest)(formToFaqPayload(values)),
                  );
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
