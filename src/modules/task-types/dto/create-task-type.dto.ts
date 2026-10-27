import { IsBoolean, IsDateString, IsInt, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskTypeDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  /** App alias for `emoji`. */
  @IsOptional()
  @IsString()
  icon?: string;

  /** App alias stored as `title.en`. */
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  title?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
