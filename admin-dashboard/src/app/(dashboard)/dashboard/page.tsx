'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { NavIcon } from '@/components/nav-icon';
import { useI18n } from '@/hooks/use-i18n';
import { NAV_FOOTER, NAV_SECTIONS, type NavItem } from '@/lib/navigation';

function allNavItems(): NavItem[] {
  return [
    ...NAV_SECTIONS.flatMap((s) => s.items),
    ...NAV_FOOTER,
  ];
}

export default function DashboardHomePage() {
  const { t } = useI18n();
  const items = allNavItems().filter((i) => i.key !== 'home');

  return (
    <div>
      <PageHeader title={t('nav.home')} description={t('dashboard.desc')} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.path}
            className="page-card group flex items-start gap-3 p-5 transition hover:border-indigo-200 hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
              <NavIcon name={item.icon} />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">{t(item.labelKey)}</h2>
              <p className="mt-1 text-[0.85rem] text-slate-500">{item.path}</p>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-[0.95rem] text-slate-500">
        {t('dashboard.docs')}{' '}
        <code className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[0.85rem]">docs/ADMIN.md</code>
        {' — '}
        <a
          className="font-medium text-indigo-600 underline-offset-2 hover:underline"
          href={`${process.env.NEXT_PUBLIC_API_URL ?? ''}/docs`}
          target="_blank"
          rel="noreferrer"
        >
          Swagger /docs
        </a>
      </p>
    </div>
  );
}
