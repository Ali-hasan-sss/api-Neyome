import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from '../../entities/reward.entity';
import { User } from '../../entities/user.entity';
import { PointLedger } from '../../entities/point-ledger.entity';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reward, User, PointLedger])],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
