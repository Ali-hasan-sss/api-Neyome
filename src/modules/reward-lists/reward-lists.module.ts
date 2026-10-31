import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardList } from '../../entities/reward-list.entity';
import { Family } from '../../entities/family.entity';
import { RewardListsService } from './reward-lists.service';
import { RewardListsController } from './reward-lists.controller';
import { SubscriptionPlansModule } from '../subscription-plans/subscription-plans.module';

@Module({
  imports: [TypeOrmModule.forFeature([RewardList, Family]), SubscriptionPlansModule],
  controllers: [RewardListsController],
  providers: [RewardListsService],
  exports: [RewardListsService],
})
export class RewardListsModule {}
