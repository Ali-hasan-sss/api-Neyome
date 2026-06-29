import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateMeDto } from './update-me.dto';

export class UpdateMeMultipartDto extends UpdateMeDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Profile image file (JPEG, PNG, WebP, HEIC, AVIF — max 5 MB). Processed to WebP 512px.',
  })
  profileImage?: Express.Multer.File;
}

export class UploadAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile image file (JPEG, PNG, WebP, HEIC, AVIF — max 5 MB). Processed to WebP 512px.',
  })
  profileImage: Express.Multer.File;
}
