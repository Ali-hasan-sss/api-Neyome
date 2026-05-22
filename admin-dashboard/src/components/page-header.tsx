export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[1.65rem] font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1.5 text-[0.95rem] leading-relaxed text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}
