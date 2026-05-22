# Neyome Admin Dashboard

Next.js 16 + Zustand + Tailwind — واجهة إدارة متصلة بـ Neyome API.

## التشغيل

1. شغّل الـ API وزرع البيانات:

```bash
# من جذر api-Neyome
npm run seed:admin
npm run start:dev
```

2. شغّل الداشبورد:

```bash
cd admin-dashboard
cp .env.local.example .env.local
npm install
npm run dev
```

افتح [http://localhost:3001](http://localhost:3001) — الدخول بالبيانات من `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## الهيكل

```
src/
  app/
    login/              # تسجيل دخول الإدمن
    (dashboard)/        # مسارات محمية
      dashboard/        # الرئيسية + بطاقات الروابط
      users/
      plans/
      legal/privacy|terms/
      faqs/
      pages/
      support-categories/
      support-requests/
      daily-quotes/
  components/           # Sidebar, AuthGuard, JsonField
  stores/auth-store.ts  # Zustand + persist (JWT)
  lib/api.ts            # عميل API
  hooks/use-admin-fetch.ts
```

## التوثيق

راجع [docs/ADMIN.md](../docs/ADMIN.md) لجميع endpoints ومتطلبات الطلبات.
