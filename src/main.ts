import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  const adminOrigins = (process.env.ADMIN_CORS_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const frontendOrigins = (process.env.FRONTEND_CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowedOrigins = [...new Set([...adminOrigins, ...frontendOrigins])];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-locale', 'Accept-Language'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  const config = new DocumentBuilder()
    .setTitle('Neyome API')
    .setDescription(
      'Neyome REST API. The mobile app must send header `x-api-key` (server `API_KEY`). Browser calls from `FRONTEND_CORS_ORIGINS` and `ADMIN_CORS_ORIGINS` do not. Also exempt: `/public/*`, `/admin/*`, and `POST /billing/stripe/webhook`. **HTML reference:** [/api-reference.html](/api-reference.html) · **Admin guide:** `docs/ADMIN.md`',
    )
    .setVersion('1.0.0')
    .addTag('Public', 'No authentication — FAQs, privacy, terms')
    .addTag('Auth', 'App users — register, login, Google sign-in, family, email change')
    .addTag('Admin Auth', 'Admin dashboard authentication')
    .addTag('Admin Users', 'Admin dashboard — user management')
    .addTag('Admin CMS', 'Admin dashboard — CMS CRUD')
    .addTag('Admin Billing', 'Admin dashboard — subscriptions & Stripe')
    .addTag('Admin Navigation', 'Admin dashboard — nav metadata')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description:
          'Mobile API key. Send the server API_KEY value in the x-api-key header on every app request except /public, /admin, and the Stripe webhook.',
      },
      'apiKey',
    )
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'admin-jwt')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  applyMobileApiKeySecurity(document as unknown as { paths?: Record<string, Record<string, unknown>> });
  (document as unknown as Record<string, unknown>)['x-tagGroups'] = [
    {
      name: 'Admin Dashboard',
      tags: ['Admin Auth', 'Admin Users', 'Admin CMS', 'Admin Billing', 'Admin Navigation'],
    },
    { name: 'Public (no auth)', tags: ['Public'] },
    { name: 'App authentication', tags: ['Auth'] },
    {
      name: 'App API (x-api-key)',
      tags: [
        'Pages',
        'Support FAQs',
        'Support Categories',
        'Support Requests',
        'Subscription Plans',
        'Daily Quotes',
        'Users',
        'Families',
        'Tasks',
        'Rewards',
        'Billing',
      ],
    },
  ];
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      tagsSorter: (a: string, b: string) => {
        const admin = (t: string) => t.startsWith('Admin');
        if (admin(a) && !admin(b)) return -1;
        if (!admin(a) && admin(b)) return 1;
        return a.localeCompare(b);
      },
    },
  });
  await app.listen(process.env.PORT ?? 3000);
}

const SWAGGER_HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

function applyMobileApiKeySecurity(document: { paths?: Record<string, Record<string, unknown>> }) {
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    if (
      path === '/' ||
      path.startsWith('/admin') ||
      path.startsWith('/public') ||
      path === '/billing/stripe/webhook'
    ) {
      continue;
    }
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!SWAGGER_HTTP_METHODS.has(method) || !operation || typeof operation !== 'object') continue;
      const op = operation as { security?: Array<Record<string, string[]>> };
      const security = op.security ?? [];
      if (!security.some((entry) => Object.prototype.hasOwnProperty.call(entry, 'apiKey'))) {
        op.security = [...security, { apiKey: [] }];
      }
    }
  }
}

bootstrap();
