import { IsDateString, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePageDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsObject()
  cards?: any;

  @IsOptional()
  @IsObject()
  content?: any;

  @IsOptional()
  @IsObject()
  locales?: any;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}
