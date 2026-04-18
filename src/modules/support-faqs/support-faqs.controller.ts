import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateSupportFaqDto } from './dto/create-support-faq.dto';
import { UpdateSupportFaqDto } from './dto/update-support-faq.dto';
import { SupportFaqsService } from './support-faqs.service';

@UseGuards(ApiKeyGuard)
@ApiTags('Support FAQs')
@Controller('support-faqs')
export class SupportFaqsController {
  constructor(private readonly service: SupportFaqsService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiOkWrappedPaginatedResponse(CreateSupportFaqDto, {
    items: [
      { id: 'faq11111-2222-3333-4444-555555555555', question: { en: 'Q?' }, answer: { en: 'A.' } },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query).then((data) => ({ success: true, data, message: 'Support FAQs fetched' }));
  }

  @Get(':id')
  @ApiOkWrappedResponse(CreateSupportFaqDto, {
    id: 'faq11111-2222-3333-4444-555555555555',
    question: { en: 'Q?' },
    answer: { en: 'A.' },
  })
  @ApiErrorResponses()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id).then((data) => ({ success: true, data, message: 'Support FAQ fetched' }));
  }

  @Post()
  @ApiCreatedWrappedResponse(CreateSupportFaqDto, {
    id: 'faq11111-2222-3333-4444-555555555555',
    question: { en: 'Q?' },
    answer: { en: 'A.' },
  })
  @ApiErrorResponses()
  create(@Body() dto: CreateSupportFaqDto) {
    return this.service.create(dto).then((data) => ({ success: true, data, message: 'Support FAQ created' }));
  }

  @Patch(':id')
  @ApiOkWrappedResponse(CreateSupportFaqDto, {
    id: 'faq11111-2222-3333-4444-555555555555',
    answer: { en: 'A (updated).' },
  })
  @ApiErrorResponses()
  update(@Param('id') id: string, @Body() dto: UpdateSupportFaqDto) {
    return this.service.update(id, dto).then((data) => ({ success: true, data, message: 'Support FAQ updated' }));
  }

  @Delete(':id')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Support FAQ deleted' },
        data: { type: 'object', properties: { id: { type: 'string', format: 'uuid', example: 'faq11111-2222-3333-4444-555555555555' } } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Param('id') id: string) {
    return this.service.remove(id).then((data) => ({ success: true, data, message: 'Support FAQ deleted' }));
  }
}
