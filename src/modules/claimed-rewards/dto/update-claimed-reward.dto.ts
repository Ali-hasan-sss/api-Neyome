import { PartialType } from '@nestjs/mapped-types';
import { CreateClaimedRewardDto } from './create-claimed-reward.dto';

export class UpdateClaimedRewardDto extends PartialType(CreateClaimedRewardDto) {}
