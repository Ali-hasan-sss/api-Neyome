import { IsDateString, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSupportRequestDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string | null;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
