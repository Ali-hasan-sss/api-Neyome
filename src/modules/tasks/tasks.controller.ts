import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiCreatedWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiQuery({ name: 'title', required: false, description: 'Filter by title (contains)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'assigneeId', required: false, description: 'Filter by assigneeId (uuid)' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedPaginatedResponse(CreateTaskDto, {
    items: [
      {
        id: 'f5b3d0b8-aaaa-bbbb-cccc-000000000001',
        title: 'Do homework',
        status: 'pending',
        points: 10,
        assigneeId: '7c6b9f0e-2222-3333-4444-bbbbbbbbbbbb',
        familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa',
        dueAt: '2025-01-01T18:00:00Z',
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(
    @Request() req: any,
    @Query()
    query: PaginationQueryDto & {
      title?: string;
      status?: string;
      assigneeId?: string;
    },
  ) {
    // Filter by user's family
    return this.tasksService.findAll({ ...query, familyId: req.user.familyId }).then((data) => ({ success: true, data, message: 'Tasks fetched' }));
  }

  @Get(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateTaskDto, {
    id: 'f5b3d0b8-aaaa-bbbb-cccc-000000000001',
    title: 'Do homework',
    status: 'pending',
    points: 10,
  })
  @ApiErrorResponses()
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.tasksService.findOneForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'Task fetched' }));
  }

  @Post()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiCreatedWrappedResponse(CreateTaskDto, {
    id: 'f5b3d0b8-aaaa-bbbb-cccc-000000000001',
    title: 'Do homework',
    status: 'pending',
    points: 10,
    assigneeId: '7c6b9f0e-2222-3333-4444-bbbbbbbbbbbb',
    familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa',
    dueAt: '2025-01-01T18:00:00Z',
  })
  @ApiErrorResponses()
  create(@Request() req: any, @Body() dto: CreateTaskDto) {
    // Set familyId from JWT
    return this.tasksService.create({ ...dto, familyId: req.user.familyId }).then((data) => ({ success: true, data, message: 'Task created' }));
  }

  @Patch(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateTaskDto, {
    id: 'f5b3d0b8-aaaa-bbbb-cccc-000000000001',
    title: 'Do homework',
    status: 'completed',
    completed: true,
  })
  @ApiErrorResponses()
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.updateForFamily(id, req.user.familyId, dto).then((data) => ({ success: true, data, message: 'Task updated' }));
  }

  @Delete(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Task deleted' },
        data: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid', example: 'f5b3d0b8-aaaa-bbbb-cccc-000000000001' } },
        },
      },
    },
    examples: {
      default: {
        summary: 'Wrapped delete response',
        value: { success: true, message: 'Task deleted', data: { id: 'f5b3d0b8-aaaa-bbbb-cccc-000000000001' } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Request() req: any, @Param('id') id: string) {
    return this.tasksService.removeForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'Task deleted' }));
  }
}
