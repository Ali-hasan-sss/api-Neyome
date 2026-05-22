'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Modal } from '@/components/ui/modal';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { AdminUserForm, adminUserToForm } from '@/components/forms/admin-user-form';
import { AssignPlanForm } from '@/components/forms/assign-plan-form';
import { Field, inputClass, FormActions, Alert } from '@/components/ui/form';
import { useAdminFetch } from '@/hooks/use-admin-fetch';
import { useCrudActions } from '@/hooks/use-crud-actions';
import { useI18n } from '@/hooks/use-i18n';
import type { AdminUser, Paginated } from '@/lib/types';

const PAGE_SIZE = 15;

type ModalMode = 'create' | 'edit' | 'password' | 'plan' | null;

function buildUsersPath(page: number, search: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const q = search.trim();
  if (q) params.set('search', q);
  return `/admin/users?${params.toString()}`;
}

export default function UsersPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const usersPath = useMemo(() => buildUsersPath(page, search), [page, search]);
  const { data, loading, error, reload } = useAdminFetch<Paginated<AdminUser>>(usersPath, [page, search]);
  const { saving, error: crudError, create, update, remove, clearError } = useCrudActions();

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setResetPassword('');
    clearError();
  };

  const familyPlan = (u: AdminUser) => {
    const family = u.family as { plan?: { backendId?: string } } | undefined;
    return family?.plan?.backendId ?? '—';
  };

  const actionBtn =
    'rounded-md border border-slate-200 px-2.5 py-1 text-[0.85rem] transition hover:border-indigo-300';

  return (
    <div>
      <PageHeader title={t('users.title')} description={t('users.desc')}>
        <button
          type="button"
          onClick={() => {
            clearError();
            setModal('create');
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          + {t('users.add')}
        </button>
      </PageHeader>

      <div className="users-toolbar">
        <label className="users-search">
          <span className="sr-only">{t('users.search')}</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('users.searchPlaceholder')}
            autoComplete="off"
          />
        </label>
      </div>

      {loading && <p className="text-slate-500">{t('common.loading')}</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('users.name')}</th>
                <th>{t('users.email')}</th>
                <th>{t('users.isParent')}</th>
                <th>{t('users.plan')}</th>
                <th>{t('users.points')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    {t('users.noResults')}
                  </td>
                </tr>
              ) : (
                data.items.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name ?? '—'}</td>
                    <td className="cell-mono">{u.email ?? '—'}</td>
                    <td>{u.isParent ? t('common.yes') : t('common.no')}</td>
                    <td className="cell-mono">{familyPlan(u)}</td>
                    <td>{u.points ?? 0}</td>
                    <td className="cell-actions">
                      <div className="actions-row">
                        <button
                          type="button"
                          onClick={() => {
                            clearError();
                            setSelected(u);
                            setModal('edit');
                          }}
                          className={actionBtn}
                        >
                          {t('common.edit')}
                        </button>
                        {u.isParent && u.familyId && (
                          <button
                            type="button"
                            onClick={() => {
                              clearError();
                              setSelected(u);
                              setModal('plan');
                            }}
                            className={`${actionBtn} border-indigo-100 text-indigo-700 hover:bg-indigo-50`}
                          >
                            {t('users.assignPlan')}
                          </button>
                        )}
                        {u.isParent && (
                          <button
                            type="button"
                            onClick={() => {
                              clearError();
                              setSelected(u);
                              setModal('password');
                            }}
                            className={actionBtn}
                          >
                            {t('users.resetPassword')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(t('common.confirmDelete'))) return;
                            const ok = await remove(`/admin/users/${u.id}`);
                            if (ok) reload();
                          }}
                          className={`${actionBtn} border-red-100 text-red-600 hover:bg-red-50`}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <PaginationBar
            page={data.page}
            limit={data.limit}
            total={data.total}
            disabled={loading}
            onPageChange={setPage}
          />
        </div>
      )}

      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={closeModal}
        title={modal === 'create' ? t('users.add') : t('common.edit')}
        wide
      >
        <AdminUserForm
          key={modal === 'create' ? 'new' : selected?.id}
          initial={adminUserToForm(modal === 'edit' ? selected ?? undefined : undefined, modal === 'create')}
          isCreate={modal === 'create'}
          loading={saving}
          error={crudError}
          onCancel={closeModal}
          onSubmit={async (values) => {
            if (modal === 'create') {
              const ok = await create('/admin/users', {
                email: values.email,
                password: values.password,
                name: values.name,
                isParent: values.isParent,
                locale: values.locale,
                familyId: values.isParent ? undefined : values.familyId,
              });
              if (ok) {
                closeModal();
                reload();
              }
            } else if (selected) {
              const ok = await update(`/admin/users/${selected.id}`, {
                name: values.name,
                email: values.email,
                locale: values.locale,
                points: Number(values.points),
                isParent: values.isParent,
              });
              if (ok) {
                closeModal();
                reload();
              }
            }
          }}
        />
      </Modal>

      <Modal open={modal === 'password'} onClose={closeModal} title={t('users.resetPassword')}>
        {selected && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await update(`/admin/users/${selected.id}/password`, {
                newPassword: resetPassword,
              });
              if (ok) {
                closeModal();
              }
            }}
          >
            {crudError && <Alert message={crudError} />}
            <Field label={t('users.password')}>
              <input
                type="password"
                className={inputClass}
                required
                minLength={8}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </Field>
            <FormActions onCancel={closeModal} loading={saving} />
          </form>
        )}
      </Modal>

      <Modal open={modal === 'plan'} onClose={closeModal} title={t('assignPlan.title')}>
        {selected && (
          <AssignPlanForm
            userName={selected.name ?? selected.email ?? selected.id}
            currentPlanId={familyPlan(selected) !== '—' ? familyPlan(selected) : 'free'}
            loading={saving}
            error={crudError}
            onCancel={closeModal}
            onSubmit={async (backendPlanId) => {
              const ok = await update(`/admin/users/${selected.id}/family-plan`, { backendPlanId });
              if (ok) {
                closeModal();
                reload();
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
}
