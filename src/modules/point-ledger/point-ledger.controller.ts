import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreatePointLedgerDto } from './dto/create-point-ledger.dto';
import { UpdatePointLedgerDto } from './dto/update-point-ledger.dto';
import { PointLedgerService } from './point-ledger.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Point Ledger')
@Controller('point-ledger')
export class PointLedgerController {
  constructor(private readonly service: PointLedgerService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedPaginatedResponse(CreatePointLedgerDto, {
    items: [
      { id: 'pl111111-2222-3333-4444-555555555555', reason: 'Task completed', amount: 10, userId: 'u...', familyId: 'f...' },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(@Request() req: any, @Query() query: PaginationQueryDto) {
    return this.service.findAllForFamily(req.user.familyId, query).then((data) => ({ success: true, data, message: 'Point ledger fetched' }));
  }

  @Get(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreatePointLedgerDto, {
    id: 'pl111111-2222-3333-4444-555555555555',
    reason: 'Task completed',
    amount: 10,
  })
  @ApiErrorResponses()
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOneForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'Point ledger item fetched' }));
  }

  @Post()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiCreatedWrappedResponse(CreatePointLedgerDto, {
    id: 'pl111111-2222-3333-4444-555555555555',
    reason: 'Task completed',
    amount: 10,
    userId: 'u...',
    familyId: 'f...'
  })
  @ApiErrorResponses()
  create(@Request() req: any, @Body() dto: CreatePointLedgerDto) {
    return this.service.create({ ...dto, userId: req.user.sub, familyId: req.user.familyId }).then((data) => ({ success: true, data, message: 'Point ledger item created' }));
  }

  @Patch(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreatePointLedgerDto, {
    id: 'pl111111-2222-3333-4444-555555555555',
    amount: 15,
  })
  @ApiErrorResponses()
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePointLedgerDto) {
    return this.service.updateForFamily(id, req.user.familyId, dto).then((data) => ({ success: true, data, message: 'Point ledger item updated' }));
  }

  @Delete(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Point ledger item deleted' },
        data: { type: 'object', properties: { id: { type: 'string', format: 'uuid', example: 'pl111111-2222-3333-4444-555555555555' } } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.removeForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'Point ledger item deleted' }));
  }
}
