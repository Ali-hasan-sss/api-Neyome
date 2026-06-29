/** API origin used for media served by the backend (uploads, avatars, …). */
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * Resolve a media URL for display in the admin dashboard.
 * - blob:/data: URLs (local file preview) are returned as-is
 * - relative paths (/uploads/…) are prefixed with NEXT_PUBLIC_API_URL
 * - absolute /uploads/ URLs are rewritten to the configured API origin
 *   (handles APP_BASE_URL on the server differing from the dashboard API URL)
 */
export function resolveMediaUrl(
  url?: string | null,
  options?: { cacheBust?: string | number },
): string | null {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  const apiBase = getApiBaseUrl();
  let resolved: string;

  if (url.startsWith('/')) {
    resolved = `${apiBase}${url}`;
  } else {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) {
        resolved = `${apiBase}${parsed.pathname}${parsed.search}`;
      } else {
        resolved = url;
      }
    } catch {
      resolved = `${apiBase}/${url.replace(/^\//, '')}`;
    }
  }

  if (options?.cacheBust != null && options.cacheBust !== '') {
    const sep = resolved.includes('?') ? '&' : '?';
    resolved = `${resolved}${sep}v=${encodeURIComponent(String(options.cacheBust))}`;
  }

  return resolved;
}
