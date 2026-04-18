import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class FamilyCodeMembersDto {
  @ApiProperty({
    description: 'Family code',
    example: 'A1B2C3',
  })
  @IsString()
  familyCode: string;
}

export class FamilyCodeChildSignInDto {
  @ApiProperty({
    description: 'Family code',
    example: 'A1B2C3',
  })
  @IsString()
  familyCode: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Child user id (selected from the family members list)',
    example: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11',
  })
  @IsUUID()
  childId: string;

  @ApiPropertyOptional({
    description: '4-digit PIN (required if child age > 6)',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/)
  pin?: string;
}
