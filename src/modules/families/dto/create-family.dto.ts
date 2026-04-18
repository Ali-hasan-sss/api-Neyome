import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFamilyDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  familyCode?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
