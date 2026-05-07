import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiOkWrappedResponse, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { NotificationSettingsResponseDto, UpdateNotificationSettingsDto } from './dto/notification-settings.dto';
import { UserSettingsService } from './user-settings.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: UserSettingsService) {}

  @Get('settings')
  @ApiOperation({
    summary: 'Get notification settings',
    description:
      'Returns push/reminder preferences for the signed-in user. Fields mirror `user_settings` columns but omit marketing; missing DB row applies defaults (push on, task/reward notifications on, no daily time). For full profile including marketing use `GET /user-settings/my-settings`.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(NotificationSettingsResponseDto, {
    id: 'u1111111-2222-3333-4444-555555555555',
    pushEnabled: true,
    dailyReminder: '18:00',
    taskAssigned: true,
    rewardApproved: true,
    updatedAt: '2026-05-08T10:00:00.000Z',
  })
  @ApiErrorResponses()
  getSettings(@Request() req: any) {
    return this.service.getNotificationSettings(req.user.sub).then((data) => ({
      success: true,
      data,
      message: 'Notification settings fetched',
    }));
  }

  @Patch('settings')
  @ApiOperation({
    summary: 'Update notification settings',
    description:
      'Partial update of notification-related columns only (`pushEnabled`, `dailyReminder`, `taskAssigned`, `rewardApproved`). Does not change marketing or other user_settings fields. HH:mm for `dailyReminder`; send null to clear.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(NotificationSettingsResponseDto, {
    id: 'u1111111-2222-3333-4444-555555555555',
    pushEnabled: false,
    dailyReminder: null,
    taskAssigned: true,
    rewardApproved: true,
    updatedAt: '2026-05-08T10:05:00.000Z',
  })
  @ApiErrorResponses()
  patchSettings(@Request() req: any, @Body() dto: UpdateNotificationSettingsDto) {
    return this.service.patchNotificationSettings(req.user.sub, dto).then((data) => ({
      success: true,
      data,
      message: 'Notification settings updated',
    }));
  }
}
