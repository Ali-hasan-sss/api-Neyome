import { Injectable } from '@nestjs/common';

export interface AdminNavLink {
  key: string;
  title: string;
  titleAr: string;
  dashboardPath: string;
  apiBase: string;
  methods: ('GET' | 'POST' | 'PATCH' | 'DELETE')[];
}

@Injectable()
export class AdminLinksService {
  getNavigation(): { sections: AdminNavLink[] } {
    return {
      sections: [
        {
          key: 'users',
          title: 'Users',
          titleAr: 'المستخدمون',
          dashboardPath: '/users',
          apiBase: '/admin/users',
          methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
        {
          key: 'subscriptions',
          title: 'Subscriptions',
          titleAr: 'الاشتراكات',
          dashboardPath: '/subscriptions',
          apiBase: '/admin/subscriptions',
          methods: ['GET'],
        },
        {
          key: 'subscription-plans',
          title: 'Subscription Plans',
          titleAr: 'خطط الاشتراك',
          dashboardPath: '/plans',
          apiBase: '/admin/subscription-plans',
          methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
        {
          key: 'privacy',
          title: 'Privacy Policy',
          titleAr: 'سياسة الخصوصية',
          dashboardPath: '/legal/privacy',
          apiBase: '/admin/pages/type/privacy',
          methods: ['GET', 'PATCH'],
        },
        {
          key: 'terms',
          title: 'Terms of Use',
          titleAr: 'شروط الاستخدام',
          dashboardPath: '/legal/terms',
          apiBase: '/admin/pages/type/terms',
          methods: ['GET', 'PATCH'],
        },
        {
          key: 'pages',
          title: 'All Pages',
          titleAr: 'جميع الصفحات',
          dashboardPath: '/pages',
          apiBase: '/admin/pages',
          methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
        {
          key: 'support-faqs',
          title: 'FAQs',
          titleAr: 'الأسئلة الشائعة',
          dashboardPath: '/faqs',
          apiBase: '/admin/support-faqs',
          methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
        {
          key: 'support-categories',
          title: 'Support Categories',
          titleAr: 'فئات الدعم',
          dashboardPath: '/support-categories',
          apiBase: '/admin/support-categories',
          methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
        {
          key: 'support-requests',
          title: 'Support Requests',
          titleAr: 'طلبات الدعم',
          dashboardPath: '/support-requests',
          apiBase: '/admin/support-requests',
          methods: ['GET', 'PATCH', 'DELETE'],
        },
        {
          key: 'daily-quotes',
          title: 'Daily Quotes',
          titleAr: 'اقتباسات يومية',
          dashboardPath: '/daily-quotes',
          apiBase: '/admin/daily-quotes',
          methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
        {
          key: 'settings',
          title: 'Settings',
          titleAr: 'الإعدادات',
          dashboardPath: '/settings',
          apiBase: '/admin/auth/change-password',
          methods: ['POST'],
        },
      ],
    };
  }
}
