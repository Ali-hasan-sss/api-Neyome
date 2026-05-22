'use client';

export const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

export const labelClass = 'block font-medium text-slate-700';

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[0.85rem] text-slate-400">{hint}</p>}
    </div>
  );
}

export function FormActions({
  onCancel,
  submitLabel = 'حفظ',
  loading,
}: {
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'جاري الحفظ...' : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        إلغاء
      </button>
    </div>
  );
}

export function Alert({ message, type = 'error' }: { message: string; type?: 'error' | 'success' }) {
  return (
    <p
      className={`mb-4 rounded-lg px-3 py-2 text-sm ${
        type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {message}
    </p>
  );
}
