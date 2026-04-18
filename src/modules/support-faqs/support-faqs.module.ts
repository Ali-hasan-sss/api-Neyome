import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportFaq } from '../../entities/support-faq.entity';
import { SupportFaqsService } from './support-faqs.service';
import { SupportFaqsController } from './support-faqs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportFaq])],
  controllers: [SupportFaqsController],
  providers: [SupportFaqsService],
  exports: [SupportFaqsService],
})
export class SupportFaqsModule {}
