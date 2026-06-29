import { Module } from '@nestjs/common';
import { StripePlanSyncService } from './stripe-plan-sync.service';

@Module({
  providers: [StripePlanSyncService],
  exports: [StripePlanSyncService],
})
export class StripePlansModule {}
