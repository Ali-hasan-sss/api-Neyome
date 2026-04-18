import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateClaimedRewardDto } from './dto/create-claimed-reward.dto';
import { UpdateClaimedRewardDto } from './dto/update-claimed-reward.dto';
import { ClaimedRewardsService } from './claimed-rewards.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Claimed Rewards')
@Controller('claimed-rewards')
export class ClaimedRewardsController {
  constructor(private readonly service: ClaimedRewardsService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedPaginatedResponse(CreateClaimedRewardDto, {
    items: [
      { id: 'cr111111-2222-3333-4444-555555555555', rewardId: 'r...', userId: 'u...', pointsUsed: 50 },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(@Request() req: any, @Query() query: PaginationQueryDto) {
    return this.service.findAllForUser(req.user.sub, query).then((data) => ({ success: true, data, message: 'Claimed rewards fetched' }));
  }

  @Get(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateClaimedRewardDto, {
    id: 'cr111111-2222-3333-4444-555555555555',
    rewardId: 'r...',
    userId: 'u...',
    pointsUsed: 50,
  })
  @ApiErrorResponses()
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOneForUser(id, req.user.sub).then((data) => ({ success: true, data, message: 'Claimed reward fetched' }));
  }

  @Post()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiCreatedWrappedResponse(CreateClaimedRewardDto, {
    id: 'cr111111-2222-3333-4444-555555555555',
    rewardId: 'r...',
    userId: 'u...',
    pointsUsed: 50,
  })
  @ApiErrorResponses()
  create(@Request() req: any, @Body() dto: CreateClaimedRewardDto) {
    return this.service.create({ ...dto, userId: req.user.sub }).then((data) => ({ success: true, data, message: 'Claimed reward created' }));
  }

  @Patch(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateClaimedRewardDto, {
    id: 'cr111111-2222-3333-4444-555555555555',
    pointsUsed: 45,
  })
  @ApiErrorResponses()
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateClaimedRewardDto) {
    return this.service.updateForUser(id, req.user.sub, dto).then((data) => ({ success: true, data, message: 'Claimed reward updated' }));
  }

  @Delete(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Claimed reward deleted' },
        data: { type: 'object', properties: { id: { type: 'string', format: 'uuid', example: 'cr111111-2222-3333-4444-555555555555' } } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.removeForUser(id, req.user.sub).then((data) => ({ success: true, data, message: 'Claimed reward deleted' }));
  }
}
