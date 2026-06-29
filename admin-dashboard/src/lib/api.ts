import type { ApiEnvelope } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  let body: ApiEnvelope<T> | { message?: string };
  try {
    body = await res.json();
  } catch {
    throw new ApiError('Invalid JSON response', res.status);
  }

  if (!res.ok || !(body as ApiEnvelope<T>).success) {
    throw new ApiError((body as ApiEnvelope<T>).message ?? 'Request failed', res.status);
  }

  return (body as ApiEnvelope<T>).data;
}

export async function apiMultipartRequest<T>(
  path: string,
  formData: FormData,
  options: { token?: string | null; method?: string } = {},
): Promise<T> {
  const { token, method = 'PATCH', ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    ...rest,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let body: ApiEnvelope<T> | { message?: string };
  try {
    body = await res.json();
  } catch {
    throw new ApiError('Invalid JSON response', res.status);
  }

  if (!res.ok || !(body as ApiEnvelope<T>).success) {
    throw new ApiError((body as ApiEnvelope<T>).message ?? 'Request failed', res.status);
  }

  return (body as ApiEnvelope<T>).data;
}

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  profileImageUrl?: string | null;
  locale?: string;
  emojiOption?: number;
  isAdmin?: boolean;
}

export const adminApi = {
  login: (email: string, password: string) =>
    apiRequest<{ accessToken: string; user: { id: string; email?: string; name?: string } }>(
      '/admin/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),

  me: (token: string) => apiRequest<UserProfile>('/admin/auth/me', { token }),

  userMe: (token: string) => apiRequest<UserProfile>('/users/me', { token }),

  updateMe: (token: string, formData: FormData) =>
    apiMultipartRequest<UserProfile>('/users/me', formData, { token, method: 'PATCH' }),

  links: (token: string) =>
    apiRequest<{ sections: import('./types').AdminNavLink[] }>('/admin/links', { token }),
};
