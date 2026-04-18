import { Controller, Get, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { ApiOkWrappedResponse, ApiErrorResponses } from '../../common/swagger/api';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { DailyQuotesService } from './daily-quotes.service';
import { DailyQuoteDto } from './dto/daily-quote.dto';

@UseGuards(ApiKeyGuard)
@ApiTags('Daily Quotes')
@Controller('daily-quotes')
export class DailyQuotesController {
  constructor(private readonly service: DailyQuotesService) {}

  @Get('today')
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Optional date override in YYYY-MM-DD (or any ISO date string). If omitted, uses today UTC date.',
    example: '2026-01-07',
  })
  @ApiOkWrappedResponse(DailyQuoteDto, {
    id: '7E4qAsElA6XiCUEZPy4c',
    text: 'Believe in yourself. Even the smallest step matters.',
    createdAt: '2025-07-16T15:35:35.787Z',
  })
  @ApiErrorResponses()
  async getToday(@Query('date') date?: string) {
    const data = await this.service.getTodayQuote(date);
    if (!data) throw new NotFoundException('Daily quote not found');
    return { success: true, data, message: 'Daily quote fetched' };
  }
}
