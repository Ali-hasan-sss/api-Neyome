'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Modal } from '@/components/ui/modal';
import { RowActions } from '@/components/crud/row-actions';
import { CategoryForm, categoryToForm } from '@/components/forms/category-form';
import { useAdminFetch } from '@/hooks/use-admin-fetch';
import { useCrudActions, newId } from '@/hooks/use-crud-actions';
import type { Paginated, SupportCategory } from '@/lib/types';

export default function SupportCategoriesPage() {
  const { data, loading, error, reload } = useAdminFetch<Paginated<SupportCategory>>(
    '/admin/support-categories?limit=50',
  );
  const { saving, error: crudError, create, update, remove, clearError } = useCrudActions();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<SupportCategory | null>(null);

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    clearError();
  };

  return (
    <div>
      <PageHeader title="فئات الدعم">
        <button
          type="button"
          onClick={() => {
            clearError();
            setModal('create');
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + إضافة فئة
        </button>
      </PageHeader>

      {loading && <p className="text-slate-500">جاري التحميل...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.items.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium">{c.name_ar ?? c.name_en}</p>
                <p className="text-xs text-slate-400">{c.name_en}</p>
              </div>
              <RowActions
                onEdit={() => {
                  clearError();
                  setSelected(c);
                  setModal('edit');
                }}
                onDelete={async () => {
                  if (!confirm('حذف هذه الفئة؟')) return;
                  const ok = await remove(`/admin/support-categories/${c.id}`);
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
        title={modal === 'create' ? 'إضافة فئة' : 'تعديل فئة'}
      >
        <CategoryForm
          key={modal === 'create' ? 'new' : selected?.id}
          initial={categoryToForm(modal === 'edit' ? selected ?? undefined : undefined, newId())}
          isCreate={modal === 'create'}
          loading={saving}
          error={crudError}
          onCancel={closeModal}
          onSubmit={async (values) => {
            const fields = {
              name_en: values.name_en,
              name_ar: values.name_ar,
              name_de: values.name_de,
            };
            const ok =
              modal === 'create'
                ? await create('/admin/support-categories', {
                    id: values.id.trim() || newId(),
                    ...fields,
                  })
                : await update(`/admin/support-categories/${selected!.id}`, fields);
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
