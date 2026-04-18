import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateStreakDto } from './dto/create-streak.dto';
import { UpdateStreakDto } from './dto/update-streak.dto';
import { StreaksService } from './streaks.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Streaks')
@Controller('streaks')
export class StreaksController {
  constructor(private readonly service: StreaksService) {}

  @Get('my-streak')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getMyStreak(@Request() req: any) {
    return this.service.findOne(req.user.sub).then((data) => ({ success: true, data, message: 'Streak fetched' }));
  }

  @Get(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id).then((data) => ({ success: true, data, message: 'Streak fetched' }));
  }

  @Patch('my-streak')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  updateMyStreak(@Request() req: any, @Body() dto: UpdateStreakDto) {
    return this.service.update(req.user.sub, dto).then((data) => ({ success: true, data, message: 'Streak updated' }));
  }
}
