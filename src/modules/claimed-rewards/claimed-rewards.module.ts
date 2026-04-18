import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimedReward } from '../../entities/claimed-reward.entity';
import { ClaimedRewardsService } from './claimed-rewards.service';
import { ClaimedRewardsController } from './claimed-rewards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClaimedReward])],
  controllers: [ClaimedRewardsController],
  providers: [ClaimedRewardsService],
  exports: [ClaimedRewardsService],
})
export class ClaimedRewardsModule {}
