import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries } from '../../common/swagger/api';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';
import { SupportRequestsService } from './support-requests.service';

@UseGuards(ApiKeyGuard)
@ApiTags('Support Requests')
@Controller('support-requests')
export class SupportRequestsController {
  constructor(private readonly service: SupportRequestsService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiOkWrappedPaginatedResponse(CreateSupportRequestDto, {
    items: [
      { id: 's1111111-2222-3333-4444-555555555555', name: 'Ali', email: 'ali@example.com', message: 'Help', categoryId: 'c111...' },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query).then((data) => ({ success: true, data, message: 'Support requests fetched' }));
  }

  @Get(':id')
  @ApiOkWrappedResponse(CreateSupportRequestDto, {
    id: 's1111111-2222-3333-4444-555555555555',
    name: 'Ali',
    email: 'ali@example.com',
    message: 'Help',
    categoryId: 'c1111111-2222-3333-4444-555555555555',
  })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id).then((data) => ({ success: true, data, message: 'Support request fetched' }));
  }

  @Post()
  @ApiCreatedWrappedResponse(CreateSupportRequestDto, {
    id: 's1111111-2222-3333-4444-555555555555',
    name: 'Ali',
    email: 'ali@example.com',
    message: 'Help',
    categoryId: 'c1111111-2222-3333-4444-555555555555',
  })
  create(@Body() dto: CreateSupportRequestDto) {
    return this.service.create(dto).then((data) => ({ success: true, data, message: 'Support request created' }));
  }

  @Patch(':id')
  @ApiOkWrappedResponse(CreateSupportRequestDto, {
    id: 's1111111-2222-3333-4444-555555555555',
    message: 'Updated message',
  })
  update(@Param('id') id: string, @Body() dto: UpdateSupportRequestDto) {
    return this.service.update(id, dto).then((data) => ({ success: true, data, message: 'Support request updated' }));
  }

  @Delete(':id')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Support request deleted' },
        data: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid', example: 's1111111-2222-3333-4444-555555555555' } },
        },
      },
    },
    examples: {
      default: {
        summary: 'Wrapped delete response',
        value: { success: true, message: 'Support request deleted', data: { id: 's1111111-2222-3333-4444-555555555555' } },
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id).then((data) => ({ success: true, data, message: 'Support request deleted' }));
  }
}
