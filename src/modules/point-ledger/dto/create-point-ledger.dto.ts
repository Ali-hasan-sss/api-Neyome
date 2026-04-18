import { IsDateString, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePointLedgerDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsInt()
  amount?: number;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsUUID()
  familyId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  refTaskId?: string;
}
