import { Body, Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UpdateStreakDto } from './dto/update-streak.dto';
import { StreaksService } from './streaks.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Streaks')
@Controller('streaks')
export class StreaksController {
  constructor(private readonly service: StreaksService) {}

  @Get('my-streak')
  @ApiOperation({
    summary: 'Current user streak',
    description:
      'Returns streak for the JWT subject (user id). Creates a zero streak row if none exists yet. ' +
      'Streak count is updated when this user completes an assigned task (see Tasks PATCH): one calendar day per assignee timezone (task `tz`) or UTC; consecutive days increment; gaps reset to 1.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Wrapped streak',
    schema: {
      example: {
        success: true,
        message: 'Streak fetched',
        data: {
          id: 'uuid-user-id',
          count: 3,
          maxCount: 5,
          lastWasOnTime: true,
          lastActiveDate: '2026-05-08T12:00:00.000Z',
        },
      },
    },
  })
  getMyStreak(@Request() req: any) {
    return this.service.ensureForUser(req.user.sub).then((data) => ({ success: true, data, message: 'Streak fetched' }));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Streak by user id',
    description: 'Returns streak row keyed by user id; does not auto-create (404 if missing).',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Wrapped streak',
    schema: {
      example: { success: true, message: 'Streak fetched', data: { id: 'uuid', count: 1, maxCount: 1 } },
    },
  })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id).then((data) => ({ success: true, data, message: 'Streak fetched' }));
  }

  @Patch('my-streak')
  @ApiOperation({
    summary: 'Update current user streak',
    description: 'Upserts streak if missing, then applies patch fields.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Wrapped updated streak',
    schema: {
      example: { success: true, message: 'Streak updated', data: { id: 'uuid-user-id', count: 2 } },
    },
  })
  updateMyStreak(@Request() req: any, @Body() dto: UpdateStreakDto) {
    return this.service.updateForUser(req.user.sub, dto).then((data) => ({ success: true, data, message: 'Streak updated' }));
  }
}
