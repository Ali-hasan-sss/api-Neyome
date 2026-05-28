import { Module } from '@nestjs/common';
import { PagesModule } from '../modules/pages/pages.module';
import { SupportFaqsModule } from '../modules/support-faqs/support-faqs.module';
import { SubscriptionPlansModule } from '../modules/subscription-plans/subscription-plans.module';
import { PublicCmsController } from './public-cms.controller';
import { PublicCmsService } from './public-cms.service';

@Module({
  imports: [PagesModule, SupportFaqsModule, SubscriptionPlansModule],
  controllers: [PublicCmsController],
  providers: [PublicCmsService],
})
export class PublicModule {}
