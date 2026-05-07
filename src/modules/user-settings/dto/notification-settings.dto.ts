import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsBoolean, IsOptional, Matches, ValidateIf } from 'class-validator';

/** Effective notification prefs returned to clients (defaults applied when DB row missing). */
export class NotificationSettingsResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Same as authenticated user id' })
  id: string;

  @ApiProperty({ description: 'Master toggle for push notifications' })
  pushEnabled: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Preferred daily reminder time (HH:mm 24h). Null if not set.',
    example: '18:00',
  })
  dailyReminder?: string | null;

  @ApiProperty({ description: 'Notify when a new task is assigned' })
  taskAssigned: boolean;

  @ApiProperty({ description: 'Notify when a reward is approved / reward-related alerts' })
  rewardApproved: boolean;

  @ApiPropertyOptional({ nullable: true, description: 'Last write time from user_settings row if present' })
  updatedAt?: Date | null;
}

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ description: 'Master toggle for push notifications' })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'HH:mm (24h). Send null to clear the reminder time.',
    example: '18:00',
  })
  @IsOptional()
  @Allow()
  @ValidateIf((_, v) => v != null && typeof v === 'string')
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'dailyReminder must be HH:mm (24-hour)' })
  dailyReminder?: string | null;

  @ApiPropertyOptional({ description: 'Notify when a new task is assigned' })
  @IsOptional()
  @IsBoolean()
  taskAssigned?: boolean;

  @ApiPropertyOptional({ description: 'Reward approval / reward-related notifications' })
  @IsOptional()
  @IsBoolean()
  rewardApproved?: boolean;
}
