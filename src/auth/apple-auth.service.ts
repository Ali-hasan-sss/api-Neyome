import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicKey, verify as verifySignature, type KeyObject } from 'crypto';

export type AppleIdentity = {
  sub: string;
  email?: string;
  name?: string;
};

type AppleJwk = {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  n?: string;
  e?: string;
};

type AppleClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
};

const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_ISSUER = 'https://appleid.apple.com';

@Injectable()
export class AppleAuthService {
  private keysFetchedAt = 0;
  private keys: AppleJwk[] = [];

  constructor(private readonly configService: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<AppleIdentity> {
    const audiences = this.audiences();
    if (!audiences.length) {
      throw new ServiceUnavailableException('Apple sign-in is not configured');
    }

    const parts = idToken.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Invalid Apple token');

    let header: { alg?: string; kid?: string };
    let claims: AppleClaims;
    try {
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Invalid Apple token');
    }

    if (header.alg !== 'RS256' || !header.kid) {
      throw new UnauthorizedException('Invalid Apple token');
    }
    if (claims.iss !== APPLE_ISSUER || typeof claims.sub !== 'string' || !claims.sub) {
      throw new UnauthorizedException('Invalid Apple token');
    }
    if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now() - 60_000) {
      throw new UnauthorizedException('Invalid Apple token');
    }

    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.some((value) => typeof value === 'string' && audiences.includes(value))) {
      throw new UnauthorizedException('Invalid Apple token');
    }

    const key = await this.signingKey(header.kid);
    const valid = verifySignature(
      'RSA-SHA256',
      Buffer.from(`${parts[0]}.${parts[1]}`),
      key,
      Buffer.from(parts[2], 'base64url'),
    );
    if (!valid) throw new UnauthorizedException('Invalid Apple token');

    const email = typeof claims.email === 'string' ? claims.email.trim().toLowerCase() : undefined;
    if (email && (claims.email_verified === false || claims.email_verified === 'false')) {
      throw new UnauthorizedException('Invalid Apple token');
    }

    return { sub: claims.sub, email: email || undefined };
  }

  private audiences(): string[] {
    const raw =
      this.configService.get<string>('APPLE_CLIENT_IDS') ||
      this.configService.get<string>('APPLE_CLIENT_ID') ||
      '';
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private async signingKey(kid: string): Promise<KeyObject> {
    let jwk = await this.findKey(kid, false);
    if (!jwk) jwk = await this.findKey(kid, true);
    if (!jwk) throw new UnauthorizedException('Invalid Apple token');
    return createPublicKey({ key: jwk as any, format: 'jwk' });
  }

  private async findKey(kid: string, force: boolean): Promise<AppleJwk | undefined> {
    const fresh = !force && this.keys.length > 0 && Date.now() - this.keysFetchedAt < 6 * 60 * 60 * 1000;
    if (!fresh) {
      const response = await fetch(APPLE_KEYS_URL);
      if (!response.ok) throw new UnauthorizedException('Invalid Apple token');
      const body = (await response.json()) as { keys?: AppleJwk[] };
      this.keys = Array.isArray(body.keys) ? body.keys : [];
      this.keysFetchedAt = Date.now();
    }
    return this.keys.find((key) => key.kid === kid && key.kty === 'RSA');
  }
}
