import { PartialType } from '@nestjs/mapped-types';
import { CreateSupportCategoryDto } from './create-support-category.dto';

export class UpdateSupportCategoryDto extends PartialType(CreateSupportCategoryDto) {}
