import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ParentGuard } from '../../auth/parent.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamiliesService } from './families.service';

@UseGuards(JwtAuthGuard, ParentGuard)
@ApiBearerAuth()
@ApiTags('Families')
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiOkWrappedPaginatedResponse(CreateFamilyDto, {
    items: [
      { id: 'b1111111-2222-3333-4444-555555555555', name: 'The Smiths', familyCode: 'ABC123' },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(@Request() req: any, @Query() query: PaginationQueryDto) {
    return this.familiesService
      .findOne(req.user.familyId)
      .then((data) => ({ success: true, data, message: 'Family fetched' }));
  }

  @Get('my-family')
  @ApiOkWrappedResponse(CreateFamilyDto, {
    id: 'b1111111-2222-3333-4444-555555555555',
    name: 'The Smiths',
    familyCode: 'ABC123',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiErrorResponses()
  getMyFamily(@Request() req: any) {
    return this.familiesService.findOne(req.user.familyId).then((data) => ({ success: true, data, message: 'Family fetched' }));
  }

  @Patch('my-family')
  @ApiOkWrappedResponse(CreateFamilyDto, {
    id: 'b1111111-2222-3333-4444-555555555555',
    name: 'The Smiths Updated',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiErrorResponses()
  updateMyFamily(@Request() req: any, @Body() dto: UpdateFamilyDto) {
    return this.familiesService.update(req.user.familyId, dto).then((data) => ({ success: true, data, message: 'Family updated' }));
  }

  @Delete('my-family')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Family deleted' },
        data: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid', example: 'b1111111-2222-3333-4444-555555555555' } },
        },
      },
    },
    examples: {
      default: {
        summary: 'Wrapped delete response',
        value: { success: true, message: 'Family deleted', data: { id: 'b1111111-2222-3333-4444-555555555555' } },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiErrorResponses()
  removeMyFamily(@Request() req: any) {
    return this.familiesService.remove(req.user.familyId).then((data) => ({ success: true, data, message: 'Family deleted' }));
  }
}
