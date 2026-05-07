import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiOkWrappedResponse, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
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
  @ApiOperation({
    summary: 'All persisted user preferences',
    description:
      'Includes marketing plus notification-related columns. For push-only prefs with defaults see `GET /notifications/settings`.',
  })
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
  @ApiOperation({
    summary: 'Upsert full user settings row',
    description:
      'Any combination of fields including `marketing`. Notification toggles can also be updated via `PATCH /notifications/settings` without touching marketing.',
  })
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
