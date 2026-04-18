import { PartialType } from '@nestjs/mapped-types';
import { CreateSupportFaqDto } from './create-support-faq.dto';

export class UpdateSupportFaqDto extends PartialType(CreateSupportFaqDto) {}
