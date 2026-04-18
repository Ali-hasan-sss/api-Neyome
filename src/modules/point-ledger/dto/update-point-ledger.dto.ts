import { PartialType } from '@nestjs/mapped-types';
import { CreatePointLedgerDto } from './create-point-ledger.dto';

export class UpdatePointLedgerDto extends PartialType(CreatePointLedgerDto) {}
