import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimedReward } from '../../entities/claimed-reward.entity';
import { User } from '../../entities/user.entity';
import { PointLedger } from '../../entities/point-ledger.entity';
import { Reward } from '../../entities/reward.entity';
import { RewardList } from '../../entities/reward-list.entity';
import { ClaimedRewardsService } from './claimed-rewards.service';
import { ClaimedRewardsController } from './claimed-rewards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClaimedReward, User, PointLedger, Reward, RewardList])],
  controllers: [ClaimedRewardsController],
  providers: [ClaimedRewardsService],
  exports: [ClaimedRewardsService],
})
export class ClaimedRewardsModule {}
