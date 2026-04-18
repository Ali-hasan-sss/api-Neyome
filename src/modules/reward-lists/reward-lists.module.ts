import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardList } from '../../entities/reward-list.entity';
import { RewardListsService } from './reward-lists.service';
import { RewardListsController } from './reward-lists.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RewardList])],
  controllers: [RewardListsController],
  providers: [RewardListsService],
  exports: [RewardListsService],
})
export class RewardListsModule {}
