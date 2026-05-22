import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { resolveLocaleFromHeaders, type AppLocale } from './locale.util';

export const RequestLocale = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AppLocale => {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    return resolveLocaleFromHeaders({
      'accept-language': req.headers['accept-language'],
      'x-locale': req.headers['x-locale'],
    });
  },
);
