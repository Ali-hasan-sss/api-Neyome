import { IsDateString, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRewardListDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
