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
  app.enableCors({
    origin: adminOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
      'Neyome REST API. **HTML reference (English):** [/api-reference.html](/api-reference.html) · **Admin guide:** see `docs/ADMIN.md`',
    )
    .setVersion('1.0.0')
    .addTag('Public', 'No authentication — FAQs, privacy, terms')
    .addTag('Auth', 'App users — register, login, family, email change')
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
        description: 'Provide your API key',
      },
      'apiKey',
    )
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'admin-jwt')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
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
bootstrap();
