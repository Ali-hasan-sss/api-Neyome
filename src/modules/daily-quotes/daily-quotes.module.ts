import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyQuote } from '../../entities/daily-quote.entity';
import { DailyQuotesController } from './daily-quotes.controller';
import { DailyQuotesService } from './daily-quotes.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyQuote])],
  controllers: [DailyQuotesController],
  providers: [DailyQuotesService],
  exports: [DailyQuotesService],
})
export class DailyQuotesModule {}
