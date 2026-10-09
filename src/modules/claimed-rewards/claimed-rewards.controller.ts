import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ClaimedRewardQueryDto } from './dto/claimed-reward-query.dto';
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
  @ApiOperation({
    summary: 'List claimed rewards',
    description:
      'Children receive their own claims. Parents receive claims for the whole family, including pending child requests. `status=pending` means not yet approved.',
  })
  @ApiPaginationQueries()
  @ApiQuery({ name: 'familyId', required: false, description: 'Must match the caller family. Parents already see that family.' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
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
  findAll(@Request() req: any, @Query() query: ClaimedRewardQueryDto) {
    return this.service.findAllForCaller(req.user, query).then((data) => ({ success: true, data, message: 'Claimed rewards fetched' }));
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
    return this.service.findOneForCaller(id, req.user).then((data) => ({ success: true, data, message: 'Claimed reward fetched' }));
  }

  @Post()
  @ApiOperation({
    summary: 'Create claimed-reward row',
    description:
      'If the row is already **committed** (`claimedAt`, `earned`, or `approved`), debits `pointsUsed` from the user. Ledger prefix `claimed_reward_obligation`.',
  })
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
  @ApiOperation({
    summary: 'Approve, reject, or update a claimed reward',
    description:
      'Parents can update a claim that belongs to their family (`approved: true` or `status: approved` to approve, `approved: false` or `status: rejected` to reject). Rejection refunds points that were already taken. Children can update only their own claim.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateClaimedRewardDto, {
    id: 'cr111111-2222-3333-4444-555555555555',
    pointsUsed: 45,
  })
  @ApiErrorResponses()
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateClaimedRewardDto) {
    return this.service.updateForCaller(id, req.user, dto).then((data) => ({ success: true, data, message: 'Claimed reward updated' }));
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete claimed reward row',
    description: 'Refunds committed `pointsUsed` when applicable (`claimed_reward_delete_refund`).',
  })
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
