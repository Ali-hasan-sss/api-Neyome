import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * API Key guard for server-to-server or admin authentication.
 * Can be used alongside JWT auth for specific admin endpoints.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
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
}
