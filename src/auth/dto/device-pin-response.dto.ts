import { ApiProperty } from '@nestjs/swagger';

export class ChildDevicePinDataDto {
  @ApiProperty({
    description:
      '4-digit device PIN (recoverable copy stored encrypted for children under 6 only). Do not log or cache in clients.',
    example: '1234',
    pattern: '^\\d{4}$',
  })
  pin: string;
}
