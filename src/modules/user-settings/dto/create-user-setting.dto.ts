import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserSettingDto {
  @IsUUID()
  id: string; // user id

  @IsOptional()
  @IsBoolean()
  marketing?: boolean;

  @IsOptional()
  @IsBoolean()
  rewardApproved?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsString()
  dailyReminder?: string;

  @IsOptional()
  @IsBoolean()
  taskAssigned?: boolean;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}
