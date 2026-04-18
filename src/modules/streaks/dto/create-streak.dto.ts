import { IsBoolean, IsDateString, IsInt, IsOptional, IsUUID } from 'class-validator';

export class CreateStreakDto {
  @IsUUID()
  id: string; // user id

  @IsOptional()
  @IsInt()
  count?: number;

  @IsOptional()
  @IsInt()
  maxCount?: number;

  @IsOptional()
  @IsBoolean()
  lastWasOnTime?: boolean;

  @IsOptional()
  @IsDateString()
  lastActiveDate?: string;
}
