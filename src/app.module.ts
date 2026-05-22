import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './database/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { FamiliesModule } from './modules/families/families.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { ClaimedRewardsModule } from './modules/claimed-rewards/claimed-rewards.module';
import { PointLedgerModule } from './modules/point-ledger/point-ledger.module';
import { StreaksModule } from './modules/streaks/streaks.module';
import { UserSettingsModule } from './modules/user-settings/user-settings.module';
import { SupportCategoriesModule } from './modules/support-categories/support-categories.module';
import { SupportRequestsModule } from './modules/support-requests/support-requests.module';
import { SupportFaqsModule } from './modules/support-faqs/support-faqs.module';
import { RewardListsModule } from './modules/reward-lists/reward-lists.module';
import { BadgesModule } from './modules/badges/badges.module';
import { TaskTypesModule } from './modules/task-types/task-types.module';
import { SubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { PagesModule } from './modules/pages/pages.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DailyQuotesModule } from './modules/daily-quotes/daily-quotes.module';
import { StripeBillingModule } from './modules/billing/stripe/stripe-billing.module';
import { AdminModule } from './admin/admin.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'public'), serveRoot: '/' }),
    TypeOrmModule.forRoot(typeOrmConfig),
    UsersModule,
    TasksModule,
    FamiliesModule,
    RewardsModule,
    ClaimedRewardsModule,
    PointLedgerModule,
    StreaksModule,
    UserSettingsModule,
    SupportCategoriesModule,
    SupportRequestsModule,
    SupportFaqsModule,
    RewardListsModule,
    BadgesModule,
    TaskTypesModule,
    SubscriptionPlansModule,
    StripeBillingModule,
    PagesModule,
    DailyQuotesModule,
    AdminModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
