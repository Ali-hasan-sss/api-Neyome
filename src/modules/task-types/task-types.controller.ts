import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ParentGuard } from '../../auth/parent.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateTaskTypeDto } from './dto/create-task-type.dto';
import { UpdateTaskTypeDto } from './dto/update-task-type.dto';
import { TaskTypesService } from './task-types.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Task Types')
@Controller('task-types')
export class TaskTypesController {
  constructor(private readonly service: TaskTypesService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedPaginatedResponse(CreateTaskTypeDto, {
    items: [
      { id: 't1111111-2222-3333-4444-555555555555', familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa', emoji: '🧹', title: { en: 'Chores' } },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(@Request() req: any, @Query() query: PaginationQueryDto) {
    return this.service.findAllForFamily(req.user.familyId, query).then((data) => ({ success: true, data, message: 'Task types fetched' }));
  }

  @Get(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateTaskTypeDto, {
    id: 't1111111-2222-3333-4444-555555555555',
    familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa',
    emoji: '🧹',
    title: { en: 'Chores' },
  })
  @ApiErrorResponses()
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOneForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'Task type fetched' }));
  }

  @Post()
  @UseGuards(ParentGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiCreatedWrappedResponse(CreateTaskTypeDto, {
    id: 't1111111-2222-3333-4444-555555555555',
    familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa',
    emoji: '🧹',
    title: { en: 'Chores' },
  })
  @ApiErrorResponses()
  create(@Request() req: any, @Body() dto: CreateTaskTypeDto) {
    return this.service.create({ ...dto, familyId: req.user.familyId }).then((data) => ({ success: true, data, message: 'Task type created' }));
  }

  @Patch(':id')
  @UseGuards(ParentGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiOkWrappedResponse(CreateTaskTypeDto, {
    id: 't1111111-2222-3333-4444-555555555555',
    title: { en: 'Chores (updated)' },
  })
  @ApiErrorResponses()
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTaskTypeDto) {
    return this.service.updateForFamily(id, req.user.familyId, dto).then((data) => ({ success: true, data, message: 'Task type updated' }));
  }

  @Delete(':id')
  @UseGuards(ParentGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Task type deleted' },
        data: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid', example: 't1111111-2222-3333-4444-555555555555' } },
        },
      },
    },
    examples: {
      default: {
        summary: 'Wrapped delete response',
        value: { success: true, message: 'Task type deleted', data: { id: 't1111111-2222-3333-4444-555555555555' } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.removeForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'Task type deleted' }));
  }
}
