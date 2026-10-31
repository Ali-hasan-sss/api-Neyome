/** Stored device tokens are a string array. Null and other shapes count as empty. */
export function readFcmTokens(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tokens: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const token = item.trim();
    if (token && !tokens.includes(token)) tokens.push(token);
  }
  return tokens;
}

export function addFcmToken(current: unknown, token?: string | null): string[] {
  const next = readFcmTokens(current);
  const value = token?.trim();
  if (value && !next.includes(value)) next.push(value);
  return next;
}

export function removeFcmToken(current: unknown, token?: string | null): string[] {
  const value = token?.trim();
  if (!value) return readFcmTokens(current);
  return readFcmTokens(current).filter((item) => item !== value);
}
