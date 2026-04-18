import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ParentGuard } from '../../auth/parent.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateRewardListDto } from './dto/create-reward-list.dto';
import { UpdateRewardListDto } from './dto/update-reward-list.dto';
import { RewardListsService } from './reward-lists.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Reward Lists')
@Controller('reward-lists')
export class RewardListsController {
  constructor(private readonly service: RewardListsService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedPaginatedResponse(CreateRewardListDto, {
    items: [
      { id: 'l1111111-2222-3333-4444-555555555555', familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa', name: 'Weekend', points: 20 },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(@Request() req: any, @Query() query: PaginationQueryDto) {
    return this.service.findAllForFamily(req.user.familyId, query).then((data) => ({ success: true, data, message: 'Reward lists fetched' }));
  }

  @Get(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateRewardListDto, {
    id: 'l1111111-2222-3333-4444-555555555555',
    familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa',
    name: 'Weekend',
    points: 20,
  })
  @ApiErrorResponses()
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOneForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'Reward list fetched' }));
  }

  @Post()
  @UseGuards(ParentGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiCreatedWrappedResponse(CreateRewardListDto, {
    id: 'l1111111-2222-3333-4444-555555555555',
    familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa',
    name: 'Weekend',
    points: 20,
  })
  @ApiErrorResponses()
  create(@Request() req: any, @Body() dto: CreateRewardListDto) {
    return this.service.create({ ...dto, familyId: req.user.familyId }).then((data) => ({ success: true, data, message: 'Reward list created' }));
  }

  @Patch(':id')
  @UseGuards(ParentGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiOkWrappedResponse(CreateRewardListDto, {
    id: 'l1111111-2222-3333-4444-555555555555',
    name: 'Weekend Updated',
    points: 25,
  })
  @ApiErrorResponses()
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateRewardListDto) {
    return this.service.updateForFamily(id, req.user.familyId, dto).then((data) => ({ success: true, data, message: 'Reward list updated' }));
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
        message: { type: 'string', example: 'Reward list deleted' },
        data: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid', example: 'l1111111-2222-3333-4444-555555555555' } },
        },
      },
    },
    examples: {
      default: {
        summary: 'Wrapped delete response',
        value: { success: true, message: 'Reward list deleted', data: { id: 'l1111111-2222-3333-4444-555555555555' } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.removeForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'Reward list deleted' }));
  }
}
