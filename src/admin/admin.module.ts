import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Page } from '../entities/page.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { SupportFaq } from '../entities/support-faq.entity';
import { SupportCategory } from '../entities/support-category.entity';
import { SupportRequest } from '../entities/support-request.entity';
import { DailyQuote } from '../entities/daily-quote.entity';
import { Family } from '../entities/family.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { PagesModule } from '../modules/pages/pages.module';
import { SubscriptionPlansModule } from '../modules/subscription-plans/subscription-plans.module';
import { SupportFaqsModule } from '../modules/support-faqs/support-faqs.module';
import { SupportCategoriesModule } from '../modules/support-categories/support-categories.module';
import { SupportRequestsModule } from '../modules/support-requests/support-requests.module';
import { DailyQuotesModule } from '../modules/daily-quotes/daily-quotes.module';
import { AdminAuthService } from './admin-auth.service';
import { AdminLinksService } from './admin-links.service';
import { AdminSeedService } from './admin-seed.service';
import { AdminGuard } from './guards/admin.guard';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminLinksController } from './controllers/admin-links.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminCmsController } from './controllers/admin-cms.controller';
import { AdminBillingController } from './controllers/admin-billing.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminBillingService } from './admin-billing.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PagesModule,
    SubscriptionPlansModule,
    SupportFaqsModule,
    SupportCategoriesModule,
    SupportRequestsModule,
    DailyQuotesModule,
    TypeOrmModule.forFeature([
      User,
      Page,
      SubscriptionPlan,
      SupportFaq,
      SupportCategory,
      SupportRequest,
      DailyQuote,
      Family,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: (configService.get<string>('ADMIN_JWT_EXPIRES_IN') || '30d') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminLinksController,
    AdminUsersController,
    AdminCmsController,
    AdminBillingController,
  ],
  providers: [
    AdminAuthService,
    AdminLinksService,
    AdminSeedService,
    AdminUsersService,
    AdminBillingService,
    AdminGuard,
  ],
  exports: [AdminSeedService, AdminGuard],
})
export class AdminModule {}
