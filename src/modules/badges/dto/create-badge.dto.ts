import { IsInt, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBadgeDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsObject()
  description?: any;

  @IsOptional()
  @IsInt()
  threshold?: number;

  @IsOptional()
  @IsObject()
  title?: any;

  @IsOptional()
  @IsString()
  trigger?: string;

  /** Task-type id the badge counts (same value as `tasks.taskType` / client `taskTypeId`). */
  @IsOptional()
  @IsString()
  taskTypeId?: string;
}
