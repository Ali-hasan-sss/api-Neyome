'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Modal } from '@/components/ui/modal';
import { LegalPageForm, legalFormToPayload, pageToLegalForm } from '@/components/forms/legal-page-form';
import { RichHtml } from '@/components/ui/rich-html';
import { useAdminFetch } from '@/hooks/use-admin-fetch';
import { useCrudActions } from '@/hooks/use-crud-actions';
import type { CmsPage } from '@/lib/types';

export default function TermsPage() {
  const { data, loading, error, reload } = useAdminFetch<CmsPage>('/admin/pages/type/terms');
  const { saving, error: crudError, update, clearError } = useCrudActions();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader title="شروط الاستخدام" description="تحرير المحتوى بثلاث لغات">
        {data && (
          <button
            type="button"
            onClick={() => {
              clearError();
              setOpen(true);
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            تعديل المحتوى
          </button>
        )}
      </PageHeader>

      {loading && <p className="text-slate-500">جاري التحميل...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">الإصدار: {data.version ?? '—'}</p>
          <div className="mt-6 space-y-6">
            {(['ar', 'en', 'de'] as const).map((loc) => (
              <section key={loc}>
                <h3 className="text-sm font-semibold uppercase text-indigo-600">{loc}</h3>
                <h4 className="mt-2 font-medium">{data.locales?.[loc]?.title ?? '—'}</h4>
                <div className="rich-html-preview mt-2 text-sm">
                  <RichHtml
                    html={data.locales?.[loc]?.body ?? ''}
                    dir={loc === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="تعديل شروط الاستخدام" wide>
        {data && (
          <LegalPageForm
            initial={pageToLegalForm(data)}
            loading={saving}
            error={crudError}
            onCancel={() => setOpen(false)}
            onSubmit={async (values) => {
              const ok = await update(`/admin/pages/${data.id}`, legalFormToPayload(values));
              if (ok) {
                setOpen(false);
                reload();
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
}
