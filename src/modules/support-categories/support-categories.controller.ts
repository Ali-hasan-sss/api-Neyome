import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateSupportCategoryDto } from './dto/create-support-category.dto';
import { UpdateSupportCategoryDto } from './dto/update-support-category.dto';
import { SupportCategoriesService } from './support-categories.service';

@UseGuards(ApiKeyGuard)
@ApiTags('Support Categories')
@Controller('support-categories')
export class SupportCategoriesController {
  constructor(private readonly service: SupportCategoriesService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiOkWrappedPaginatedResponse(CreateSupportCategoryDto, {
    items: [
      { id: 'sc111111-2222-3333-4444-555555555555', name_en: 'Billing' },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query).then((data) => ({ success: true, data, message: 'Support categories fetched' }));
  }

  @Get(':id')
  @ApiOkWrappedResponse(CreateSupportCategoryDto, {
    id: 'sc111111-2222-3333-4444-555555555555',
    name_en: 'Billing',
  })
  @ApiErrorResponses()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id).then((data) => ({ success: true, data, message: 'Support category fetched' }));
  }

  @Post()
  @ApiCreatedWrappedResponse(CreateSupportCategoryDto, {
    id: 'sc111111-2222-3333-4444-555555555555',
    name_en: 'Billing',
  })
  @ApiErrorResponses()
  create(@Body() dto: CreateSupportCategoryDto) {
    return this.service.create(dto).then((data) => ({ success: true, data, message: 'Support category created' }));
  }

  @Patch(':id')
  @ApiOkWrappedResponse(CreateSupportCategoryDto, {
    id: 'sc111111-2222-3333-4444-555555555555',
    name_en: 'Billing (updated)',
  })
  @ApiErrorResponses()
  update(@Param('id') id: string, @Body() dto: UpdateSupportCategoryDto) {
    return this.service.update(id, dto).then((data) => ({ success: true, data, message: 'Support category updated' }));
  }

  @Delete(':id')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Support category deleted' },
        data: { type: 'object', properties: { id: { type: 'string', format: 'uuid', example: 'sc111111-2222-3333-4444-555555555555' } } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Param('id') id: string) {
    return this.service.remove(id).then((data) => ({ success: true, data, message: 'Support category deleted' }));
  }
}
