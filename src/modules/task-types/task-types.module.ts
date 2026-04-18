import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskType } from '../../entities/task-type.entity';
import { TaskTypesService } from './task-types.service';
import { TaskTypesController } from './task-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskType])],
  controllers: [TaskTypesController],
  providers: [TaskTypesService],
  exports: [TaskTypesService],
})
export class TaskTypesModule {}
