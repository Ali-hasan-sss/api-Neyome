'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useI18n } from '@/hooks/use-i18n';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LogoutIcon, NavIcon } from '@/components/nav-icon';
import { NAV_FOOTER, NAV_SECTIONS, isNavActive, type NavItem } from '@/lib/navigation';

function NavLink({
  item,
  pathname,
  label,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  label: string;
  onNavigate?: () => void;
}) {
  const active = isNavActive(pathname, item);
  return (
    <Link
      href={item.path}
      onClick={onNavigate}
      className={`nav-link ${active ? 'nav-link-active' : ''}`}
    >
      <NavIcon name={item.icon} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}

export function Sidebar({
  mobileOpen = false,
  onNavigate,
  onClose,
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { t, dir } = useI18n();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      id="admin-sidebar"
      className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}
      dir={dir}
    >
      <header className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" aria-hidden>
            <span className="text-lg font-bold text-white">N</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="sidebar-brand-tag">{t('app.brand')}</p>
            <h1 className="sidebar-brand-title">{t('app.title')}</h1>
            {user?.email && <p className="sidebar-brand-email">{user.email}</p>}
          </div>
        </div>
        <button
          type="button"
          className="sidebar-close-btn lg:hidden"
          aria-label={t('nav.closeMenu')}
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <nav className="sidebar-nav" aria-label={t('app.title')}>
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className="sidebar-section">
            {section.labelKey && (
              <p className="sidebar-section-label">{t(section.labelKey)}</p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.key}
                item={item}
                pathname={pathname}
                label={t(item.labelKey)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <footer className="sidebar-footer">
        {NAV_FOOTER.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            pathname={pathname}
            label={t(item.labelKey)}
            onNavigate={onNavigate}
          />
        ))}
        <LanguageSwitcher />
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="sidebar-logout"
        >
          <LogoutIcon />
          <span>{t('nav.logout')}</span>
        </button>
      </footer>
    </aside>
  );
}
