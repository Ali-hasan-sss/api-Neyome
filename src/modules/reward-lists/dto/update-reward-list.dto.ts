import { PartialType } from '@nestjs/mapped-types';
import { CreateRewardListDto } from './create-reward-list.dto';

export class UpdateRewardListDto extends PartialType(CreateRewardListDto) {}
