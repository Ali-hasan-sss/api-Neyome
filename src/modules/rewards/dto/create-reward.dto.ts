import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRewardDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @IsBoolean()
  earned?: boolean;

  @IsOptional()
  @IsBoolean()
  fulfilled?: boolean;

  @IsOptional()
  @IsInt()
  progress?: number;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  dayClaimed?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
