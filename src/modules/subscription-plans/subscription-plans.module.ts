import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { StripePlansModule } from '../billing/stripe/stripe-plans.module';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan]), StripePlansModule],
  controllers: [SubscriptionPlansController],
  providers: [SubscriptionPlansService],
  exports: [SubscriptionPlansService],
})
export class SubscriptionPlansModule {}
