'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useI18n } from '@/hooks/use-i18n';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t, dir } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen, closeSidebar]);

  return (
    <div className="dashboard-shell" dir={dir}>
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label={t('nav.closeMenu')}
          onClick={closeSidebar}
        />
      )}

      <Sidebar
        mobileOpen={sidebarOpen}
        onNavigate={closeSidebar}
        onClose={closeSidebar}
      />

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="sidebar-toggle"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            onClick={toggleSidebar}
          >
            <MenuIcon open={sidebarOpen} />
            <span>{sidebarOpen ? t('nav.closeMenu') : t('nav.openMenu')}</span>
          </button>
        </header>
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="sidebar-toggle-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      {open ? (
        <>
          <path d="M18 6 6 18M6 6l12 12" />
        </>
      ) : (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </>
      )}
    </svg>
  );
}
