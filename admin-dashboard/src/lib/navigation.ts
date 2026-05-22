export type NavItem = {
  key: string;
  path: string;
  labelKey: string;
  icon: NavIconName;
  /** Match exact path only (e.g. home) */
  exact?: boolean;
};

export type NavIconName =
  | 'home'
  | 'users'
  | 'subscriptions'
  | 'plans'
  | 'privacy'
  | 'terms'
  | 'pages'
  | 'faqs'
  | 'categories'
  | 'requests'
  | 'quotes'
  | 'settings';

export const NAV_SECTIONS: { labelKey?: string; items: NavItem[] }[] = [
  {
    items: [{ key: 'home', path: '/dashboard', labelKey: 'nav.home', icon: 'home', exact: true }],
  },
  {
    labelKey: 'nav.section.manage',
    items: [
      { key: 'users', path: '/users', labelKey: 'nav.users', icon: 'users' },
      { key: 'subscriptions', path: '/subscriptions', labelKey: 'nav.subscriptions', icon: 'subscriptions' },
      { key: 'subscription-plans', path: '/plans', labelKey: 'nav.plans', icon: 'plans' },
    ],
  },
  {
    labelKey: 'nav.section.content',
    items: [
      { key: 'privacy', path: '/legal/privacy', labelKey: 'nav.privacy', icon: 'privacy' },
      { key: 'terms', path: '/legal/terms', labelKey: 'nav.terms', icon: 'terms' },
      { key: 'pages', path: '/pages', labelKey: 'nav.pages', icon: 'pages' },
      { key: 'support-faqs', path: '/faqs', labelKey: 'nav.faqs', icon: 'faqs' },
      { key: 'support-categories', path: '/support-categories', labelKey: 'nav.categories', icon: 'categories' },
      { key: 'support-requests', path: '/support-requests', labelKey: 'nav.requests', icon: 'requests' },
      { key: 'daily-quotes', path: '/daily-quotes', labelKey: 'nav.quotes', icon: 'quotes' },
    ],
  },
];

export const NAV_FOOTER: NavItem[] = [
  { key: 'settings', path: '/settings', labelKey: 'nav.settings', icon: 'settings', exact: true },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.path;
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
