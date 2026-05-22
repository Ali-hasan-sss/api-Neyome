import { ApiProperty } from '@nestjs/swagger';

export class ChildDevicePinDataDto {
  @ApiProperty({
    description:
      'Device PIN (emoji or numeric; recoverable for children age 6 and under only). Do not log or cache in clients.',
    example: '1234',
    pattern: '^\\d{4}$',
  })
  pin: string;
}
