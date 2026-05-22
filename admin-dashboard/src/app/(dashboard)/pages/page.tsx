'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Modal } from '@/components/ui/modal';
import { RowActions } from '@/components/crud/row-actions';
import { PageForm, cmsPageToForm } from '@/components/forms/page-form';
import { toLocaleContent } from '@/lib/i18n';
import { stableUuidSync } from '@/lib/stable-id';
import { useAdminFetch } from '@/hooks/use-admin-fetch';
import { useCrudActions } from '@/hooks/use-crud-actions';
import type { CmsPage, Paginated } from '@/lib/types';

export default function PagesListPage() {
  const { data, loading, error, reload } = useAdminFetch<Paginated<CmsPage>>('/admin/pages?limit=50');
  const { saving, error: crudError, create, update, remove, clearError } = useCrudActions();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<CmsPage | null>(null);

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    clearError();
  };

  return (
    <div>
      <PageHeader title="جميع الصفحات" description="about_us, privacy, terms وغيرها">
        <button
          type="button"
          onClick={() => {
            clearError();
            setModal('create');
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + إضافة صفحة
        </button>
      </PageHeader>

      {loading && <p className="text-slate-500">جاري التحميل...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <ul className="space-y-2">
          {data.items.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <span className="font-mono text-sm text-indigo-600">{p.type ?? p.id}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-sm text-slate-600">v{p.version ?? '—'}</span>
              </div>
              <RowActions
                onEdit={() => {
                  clearError();
                  setSelected(p);
                  setModal('edit');
                }}
                onDelete={async () => {
                  if (!confirm(`حذف الصفحة "${p.type}"؟`)) return;
                  const ok = await remove(`/admin/pages/${p.id}`);
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
        title={modal === 'create' ? 'إضافة صفحة' : 'تعديل صفحة'}
        wide
      >
        <PageForm
          key={modal === 'create' ? 'new' : selected?.id}
          initial={cmsPageToForm(modal === 'edit' ? selected ?? undefined : undefined)}
          isCreate={modal === 'create'}
          loading={saving}
          error={crudError}
          onCancel={closeModal}
          onSubmit={async (values) => {
            const locales = toLocaleContent(values.locales);
            if (modal === 'create') {
              const slug = values.slug.trim();
              const ok = await create('/admin/pages', {
                id: stableUuidSync('page', slug),
                type: values.type || slug,
                version: values.version,
                locales,
              });
              if (ok) {
                closeModal();
                reload();
              }
            } else {
              const ok = await update(`/admin/pages/${selected!.id}`, {
                type: values.type,
                version: values.version,
                locales,
              });
              if (ok) {
                closeModal();
                reload();
              }
            }
          }}
        />
      </Modal>
    </div>
  );
}
