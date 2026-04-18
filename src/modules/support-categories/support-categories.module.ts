import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportCategory } from '../../entities/support-category.entity';
import { SupportCategoriesService } from './support-categories.service';
import { SupportCategoriesController } from './support-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportCategory])],
  controllers: [SupportCategoriesController],
  providers: [SupportCategoriesService],
  exports: [SupportCategoriesService],
})
export class SupportCategoriesModule {}
