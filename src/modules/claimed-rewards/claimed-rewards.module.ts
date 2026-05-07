import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimedReward } from '../../entities/claimed-reward.entity';
import { User } from '../../entities/user.entity';
import { PointLedger } from '../../entities/point-ledger.entity';
import { ClaimedRewardsService } from './claimed-rewards.service';
import { ClaimedRewardsController } from './claimed-rewards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClaimedReward, User, PointLedger])],
  controllers: [ClaimedRewardsController],
  providers: [ClaimedRewardsService],
  exports: [ClaimedRewardsService],
})
export class ClaimedRewardsModule {}
