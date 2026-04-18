import { IsInt, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsObject()
  badge?: any;

  @IsOptional()
  @IsObject()
  features?: any;

  @IsOptional()
  @IsString()
  productId?: string | null;

  @IsOptional()
  @IsObject()
  subtitle?: any;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsObject()
  title?: any;

  @IsOptional()
  @IsObject()
  periodShort?: any;

  @IsOptional()
  @IsInt()
  limitsVersion?: number;

  @IsOptional()
  @IsObject()
  limits?: any;
}
