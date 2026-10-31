import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../entities/task.entity';
import { Family } from '../../entities/family.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { StreaksModule } from '../streaks/streaks.module';
import { BadgesModule } from '../badges/badges.module';
import { SubscriptionPlansModule } from '../subscription-plans/subscription-plans.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Family]), StreaksModule, BadgesModule, SubscriptionPlansModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
