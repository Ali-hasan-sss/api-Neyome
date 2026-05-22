import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

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
    description:
      'Child device PIN. **Age > 6:** 4 digits (required). **Age ≤ 6:** 4-character emoji PIN or 4 digits if the child has a PIN set.',
    example: '1234',
  })
  @IsOptional()
  @IsString()
  pin?: string;
}
