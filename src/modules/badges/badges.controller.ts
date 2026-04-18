import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ParentGuard } from '../../auth/parent.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { BadgesService } from './badges.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly service: BadgesService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedPaginatedResponse(CreateBadgeDto, {
    items: [
      { id: 'b9999999-2222-3333-4444-555555555555', familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa', emoji: '🏆', threshold: 100 },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(@Request() req: any, @Query() query: PaginationQueryDto) {
    return this.service.findAllForFamily(req.user.familyId, query).then((data) => ({ success: true, data, message: 'Badges fetched' }));
  }

  @Get(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateBadgeDto, {
    id: 'b9999999-2222-3333-4444-555555555555',
    familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa',
    emoji: '🏆',
    threshold: 100,
  })
  @ApiErrorResponses()
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOneForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'Badge fetched' }));
  }

  @Post()
  @UseGuards(ParentGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiCreatedWrappedResponse(CreateBadgeDto, {
    id: 'b9999999-2222-3333-4444-555555555555',
    familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa',
    emoji: '🏆',
    threshold: 100,
  })
  @ApiErrorResponses()
  create(@Request() req: any, @Body() dto: CreateBadgeDto) {
    return this.service.create({ ...dto, familyId: req.user.familyId }).then((data) => ({ success: true, data, message: 'Badge created' }));
  }

  @Patch(':id')
  @UseGuards(ParentGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiOkWrappedResponse(CreateBadgeDto, {
    id: 'b9999999-2222-3333-4444-555555555555',
    threshold: 120,
  })
  @ApiErrorResponses()
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateBadgeDto) {
    return this.service.updateForFamily(id, req.user.familyId, dto).then((data) => ({ success: true, data, message: 'Badge updated' }));
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
        message: { type: 'string', example: 'Badge deleted' },
        data: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid', example: 'b9999999-2222-3333-4444-555555555555' } },
        },
      },
    },
    examples: {
      default: {
        summary: 'Wrapped delete response',
        value: { success: true, message: 'Badge deleted', data: { id: 'b9999999-2222-3333-4444-555555555555' } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.removeForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'Badge deleted' }));
  }
}
