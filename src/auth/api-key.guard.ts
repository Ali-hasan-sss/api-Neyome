import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Requires the mobile `x-api-key` header to match `API_KEY`.
 * Skips admin, public CMS, Stripe webhooks, docs, and uploads.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.method === 'OPTIONS' || this.isExemptPath(request.path || request.url || '')) {
      return true;
    }

    if (this.isWebsiteOrigin(request)) {
      return true;
    }

    const apiKey = request.headers['x-api-key'] as string | undefined;
    const expected = this.configService.get<string>('API_KEY');

    if (!expected) {
      // If no API_KEY configured, deny by default in production
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new UnauthorizedException('API key not configured');
      }
      // In development, allow access without API key
      return true;
    }

    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  /** Admin, public CMS, Stripe webhooks, and docs are not mobile app calls. */
  private isExemptPath(rawPath: string): boolean {
    const path = rawPath.split('?')[0];
    return (
      path === '/' ||
      path === '/api-reference' ||
      path.startsWith('/admin') ||
      path.startsWith('/public') ||
      path.startsWith('/docs') ||
      path.startsWith('/uploads') ||
      path === '/billing/stripe/webhook' ||
      path.endsWith('.html')
    );
  }

  /** Browser calls from the marketing site or admin dashboard. Native apps do not send these origins. */
  private isWebsiteOrigin(request: { headers?: Record<string, string | string[] | undefined> }): boolean {
    const allowed = this.allowedWebOrigins();
    if (allowed.size === 0) return false;
    const origin = this.headerValue(request, 'origin');
    if (origin && allowed.has(this.normalizeOrigin(origin))) return true;
    const referer = this.headerValue(request, 'referer');
    if (!referer) return false;
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  private allowedWebOrigins(): Set<string> {
    const raw = [
      this.configService.get<string>('ADMIN_CORS_ORIGINS') || 'http://localhost:3001',
      this.configService.get<string>('FRONTEND_CORS_ORIGINS') || '',
    ].join(',');
    return new Set(
      raw
        .split(',')
        .map((value) => this.normalizeOrigin(value))
        .filter(Boolean),
    );
  }

  private normalizeOrigin(value: string): string {
    return value.trim().replace(/\/$/, '');
  }

  private headerValue(
    request: { headers?: Record<string, string | string[] | undefined> },
    name: string,
  ): string | undefined {
    const value = request.headers?.[name];
    return Array.isArray(value) ? value[0] : value;
  }
}
