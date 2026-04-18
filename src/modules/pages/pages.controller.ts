import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PagesService } from './pages.service';

@UseGuards(ApiKeyGuard)
@ApiTags('Pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly service: PagesService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiOkWrappedPaginatedResponse(CreatePageDto, {
    items: [
      { id: 'p1111111-2222-3333-4444-555555555555', type: 'home', version: 'v1', content: { blocks: [] } },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query).then((data) => ({ success: true, data, message: 'Pages fetched' }));
  }

  @Get(':id')
  @ApiOkWrappedResponse(CreatePageDto, {
    id: 'p1111111-2222-3333-4444-555555555555',
    type: 'home',
    version: 'v1',
    content: { blocks: [] },
  })
  @ApiErrorResponses()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id).then((data) => ({ success: true, data, message: 'Page fetched' }));
  }

  @Post()
  @ApiCreatedWrappedResponse(CreatePageDto, {
    id: 'p1111111-2222-3333-4444-555555555555',
    type: 'home',
    version: 'v1',
    content: { blocks: [] },
  })
  @ApiErrorResponses()
  create(@Body() dto: CreatePageDto) {
    return this.service.create(dto).then((data) => ({ success: true, data, message: 'Page created' }));
  }

  @Patch(':id')
  @ApiOkWrappedResponse(CreatePageDto, {
    id: 'p1111111-2222-3333-4444-555555555555',
    version: 'v2',
  })
  @ApiErrorResponses()
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.service.update(id, dto).then((data) => ({ success: true, data, message: 'Page updated' }));
  }

  @Delete(':id')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Page deleted' },
        data: { type: 'object', properties: { id: { type: 'string', format: 'uuid', example: 'p1111111-2222-3333-4444-555555555555' } } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Param('id') id: string) {
    return this.service.remove(id).then((data) => ({ success: true, data, message: 'Page deleted' }));
  }
}
