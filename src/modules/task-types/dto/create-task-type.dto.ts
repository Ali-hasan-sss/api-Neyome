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
