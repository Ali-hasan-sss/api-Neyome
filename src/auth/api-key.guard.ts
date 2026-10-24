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
}
