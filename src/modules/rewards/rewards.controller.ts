import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RewardsService } from './rewards.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  @ApiPaginationQueries()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedPaginatedResponse(CreateRewardDto, {
    items: [
      { id: 'r1111111-2222-3333-4444-555555555555', name: 'Bike', points: 100, userId: 'u1111111-2222-3333-4444-555555555555' },
    ],
    total: 1,
    page: 1,
    limit: 20,
  })
  @ApiErrorResponses()
  findAll(@Request() req: any, @Query() query: PaginationQueryDto) {
    return this.rewardsService.findAllForUser(req.user.sub, query).then((data) => ({ success: true, data, message: 'Rewards fetched' }));
  }

  @Get(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateRewardDto, {
    id: 'r1111111-2222-3333-4444-555555555555',
    name: 'Bike',
    points: 100,
    userId: 'u1111111-2222-3333-4444-555555555555',
  })
  @ApiErrorResponses()
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.rewardsService.findOneForUser(id, req.user.sub).then((data) => ({ success: true, data, message: 'Reward fetched' }));
  }

  @Post()
  @ApiOperation({
    summary: 'Create reward',
    description:
      'Points balance: while a reward is **claimed/redeemed** (`fulfilled`, `earned`, or `dayClaimed`), the child pays `points`. Ledger prefix `reward_obligation`.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiCreatedWrappedResponse(CreateRewardDto, {
    id: 'r1111111-2222-3333-4444-555555555555',
    name: 'Bike',
    points: 100,
    userId: 'u1111111-2222-3333-4444-555555555555',
  })
  @ApiErrorResponses()
  create(@Request() req: any, @Body() dto: CreateRewardDto) {
    return this.rewardsService.create({ ...dto, userId: req.user.sub }).then((data) => ({ success: true, data, message: 'Reward created' }));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update reward',
    description:
      '**Claim / replace / unclaim:** Uses committed `points` when the slot is redeemed (`fulfilled`, `earned`, or `dayClaimed`). Replacing with a higher cost debits the delta; clearing redemption refunds. Send `dayClaimed: null`, `fulfilled: false`, or `earned: false` as needed. **400** if insufficient points or reward has no `userId`.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateRewardDto, {
    id: 'r1111111-2222-3333-4444-555555555555',
    name: 'Bike (updated)',
    points: 120,
  })
  @ApiErrorResponses()
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateRewardDto) {
    return this.rewardsService.updateForUser(id, req.user.sub, dto).then((data) => ({ success: true, data, message: 'Reward updated' }));
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete reward',
    description:
      'If the reward was claimed, refunds the committed `points` to the child (`reward_delete_refund`) then soft-deletes.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Reward deleted' },
        data: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid', example: 'r1111111-2222-3333-4444-555555555555' } },
        },
      },
    },
    examples: {
      default: {
        summary: 'Wrapped delete response',
        value: { success: true, message: 'Reward deleted', data: { id: 'r1111111-2222-3333-4444-555555555555' } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Request() req: any, @Param('id') id: string) {
    return this.rewardsService.removeForUser(id, req.user.sub).then((data) => ({ success: true, data, message: 'Reward deleted' }));
  }
}
