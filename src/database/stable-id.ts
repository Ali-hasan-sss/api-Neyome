import * as crypto from 'crypto';

/** Deterministic UUID v4-style id from a Firebase/string key (for seeding). */
export function stableUuid(namespace: string, key: string): string {
  const hash = crypto.createHash('sha256').update(`${namespace}:${key}`).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function resolveEntityId(namespace: string, rawId: string): string {
  return isUuid(rawId) ? rawId : stableUuid(namespace, rawId);
}
