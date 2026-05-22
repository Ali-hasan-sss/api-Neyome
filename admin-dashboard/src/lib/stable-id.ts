/** Matches backend seed mapping for CMS slugs. */
function formatUuid(bytes: Uint8Array): string {
  const b = new Uint8Array(bytes);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** Sync stable id (sync hash for forms). */
export function stableUuidSync(namespace: string, key: string): string {
  const input = `${namespace}:${key}`;
  const bytes = new Uint8Array(16);
  for (let i = 0; i < input.length; i++) {
    bytes[i % 16] ^= input.charCodeAt(i);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
