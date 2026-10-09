import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClaimedRewardDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsDateString()
  claimedAt?: string;

  @IsOptional()
  @IsString()
  rewardName?: string;

  @IsOptional()
  @IsUUID()
  rewardId?: string;

  @IsOptional()
  @IsBoolean()
  approved?: boolean;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';

  @IsOptional()
  @IsBoolean()
  earned?: boolean;

  @IsOptional()
  @IsInt()
  pointsUsed?: number;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
