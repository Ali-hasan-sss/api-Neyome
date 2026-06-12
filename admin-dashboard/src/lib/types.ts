export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUser {
  id: string;
  name?: string;
  email?: string;
  isParent?: boolean;
  isAdmin?: boolean;
  familyId?: string;
  family?: {
    id: string;
    name?: string;
    familyCode?: string;
    plan?: { backendId?: string; updatedAt?: string };
  };
  points?: number;
  locale?: string;
  createdAt?: string;
}

export interface AdminNavLink {
  key: string;
  title: string;
  titleAr: string;
  dashboardPath: string;
  apiBase: string;
  methods: string[];
}

export interface SubscriptionPlan {
  id: string;
  title?: Record<string, string>;
  subtitle?: Record<string, string>;
  periodShort?: Record<string, string>;
  badge?: Record<string, string>;
  features?: Record<string, unknown>;
  productId?: string | null;
  price?: number | string | null;
  currency?: string | null;
  sort?: number;
  limitsVersion?: number;
  limits?: Record<string, unknown>;
}

export interface CmsPage {
  id: string;
  type?: string;
  version?: string;
  locales?: Record<string, { title?: string; body?: string } | undefined>;
  content?: unknown;
  cards?: unknown;
  updatedAt?: string;
}

export interface SupportFaq {
  id: string;
  question?: Record<string, string>;
  answer?: Record<string, string>;
}

export interface SupportCategory {
  id: string;
  name_en?: string;
  name_ar?: string;
  name_de?: string;
}

export interface SupportRequest {
  id: string;
  name?: string;
  email?: string;
  message?: string;
  categoryName?: string;
  categoryId?: string;
  createdAt?: string;
}

export interface DailyQuote {
  id: string;
  text?: string;
  createdAt?: string;
}
