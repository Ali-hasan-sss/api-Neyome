import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const SALT = Buffer.from('neyome-device-pin-v1', 'utf8');

function deriveKey(): Buffer {
  const secret = process.env.DEVICE_PIN_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('DEVICE_PIN_ENCRYPTION_KEY (recommended) or JWT_SECRET must be set (min 16 chars)');
  }
  return scryptSync(secret, SALT, 32);
}

/** AES-256-GCM; output is base64url(iv||tag||ciphertext). */
export function encryptDevicePin(plain: string): string {
  const iv = randomBytes(12);
  const key = deriveKey();
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function decryptDevicePin(blob: string): string {
  const buf = Buffer.from(blob, 'base64url');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const key = deriveKey();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
