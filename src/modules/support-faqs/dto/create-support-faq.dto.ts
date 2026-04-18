import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateSupportFaqDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsObject()
  question?: any;

  @IsOptional()
  @IsObject()
  answer?: any;
}
