import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiCreatedWrappedResponse, ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateUserSettingDto } from './dto/create-user-setting.dto';
import { UpdateUserSettingDto } from './dto/update-user-setting.dto';
import { UserSettingsService } from './user-settings.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('User Settings')
@Controller('user-settings')
export class UserSettingsController {
  constructor(private readonly service: UserSettingsService) {}

  @Get('my-settings')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateUserSettingDto, {
    id: 'u1111111-2222-3333-4444-555555555555',
    marketing: true,
    pushEnabled: true,
    dailyReminder: '18:00',
  })
  @ApiErrorResponses()
  getMySettings(@Request() req: any) {
    return this.service.findOne(req.user.sub).then((data) => ({ success: true, data, message: 'User settings fetched' }));
  }

  @Patch('my-settings')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(CreateUserSettingDto, {
    id: 'u1111111-2222-3333-4444-555555555555',
    marketing: false,
  })
  @ApiErrorResponses()
  updateMySettings(@Request() req: any, @Body() dto: UpdateUserSettingDto) {
    return this.service.upsert(req.user.sub, dto).then((data) => ({ success: true, data, message: 'User settings updated' }));
  }
}
