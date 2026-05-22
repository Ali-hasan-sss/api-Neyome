'use client';

export function RowActions({
  onEdit,
  onDelete,
  deleteLabel = 'حذف',
}: {
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel?: string;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
      >
        تعديل
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        {deleteLabel}
      </button>
    </div>
  );
}
