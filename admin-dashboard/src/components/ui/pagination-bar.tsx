'use client';

import { useI18n } from '@/hooks/use-i18n';

export function PaginationBar({
  page,
  limit,
  total,
  onPageChange,
  disabled,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="pagination-bar">
      <p className="pagination-summary">
        {t('pagination.showing')} <strong>{from}</strong>–<strong>{to}</strong> {t('pagination.of')}{' '}
        <strong>{total}</strong>
        {' · '}
        {t('pagination.page')} <strong>{page}</strong> / <strong>{totalPages}</strong>
      </p>
      <div className="pagination-actions">
        <button
          type="button"
          className="pagination-btn"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('pagination.prev')}
        </button>
        <button
          type="button"
          className="pagination-btn"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
}
