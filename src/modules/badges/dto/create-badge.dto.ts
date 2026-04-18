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
}
