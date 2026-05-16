import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from '../../../entities/family.entity';
import { SubscriptionPlansModule } from '../../subscription-plans/subscription-plans.module';
import { StripeBillingController } from './stripe-billing.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeBillingService } from './stripe-billing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Family]), SubscriptionPlansModule],
  controllers: [StripeBillingController, StripeWebhookController],
  providers: [StripeBillingService],
  exports: [StripeBillingService],
})
export class StripeBillingModule {}
