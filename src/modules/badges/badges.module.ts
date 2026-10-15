import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from '../../entities/badge.entity';
import { User } from '../../entities/user.entity';
import { Task } from '../../entities/task.entity';
import { Streak } from '../../entities/streak.entity';
import { BadgesService } from './badges.service';
import { BadgeAwardsService } from './badge-awards.service';
import { BadgesController } from './badges.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, User, Task, Streak])],
  controllers: [BadgesController],
  providers: [BadgesService, BadgeAwardsService],
  exports: [BadgesService, BadgeAwardsService],
})
export class BadgesModule {}
