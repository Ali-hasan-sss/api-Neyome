import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminSeedService } from '../admin/admin-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  try {
    const seeder = app.get(AdminSeedService);
    const result = await seeder.run();
    console.log('\n✅ Admin seed completed');
    console.log(`   Admin email: ${result.adminEmail}`);
    console.log(`   Records: ${JSON.stringify(result.seeded, null, 2)}`);
    console.log('\n   Users: existing app users are NOT deleted or duplicated.');
    console.log('   CMS: upsert by id (or SEED_RESET=true clears CMS only).');
    console.log('\n   Login: POST /admin/auth/login');
    console.log('   Docs:  http://localhost:3000/api-reference.html');
    console.log('   Swagger: http://localhost:3000/docs');
    console.log('   Dashboard env: NEXT_PUBLIC_API_URL=http://localhost:3000\n');
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
