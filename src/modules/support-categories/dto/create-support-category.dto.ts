import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSupportCategoryDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  name_de?: string;

  @IsOptional()
  @IsString()
  name_ar?: string;

  @IsOptional()
  @IsString()
  name_en?: string;
}
