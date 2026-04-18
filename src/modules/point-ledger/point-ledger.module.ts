import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointLedger } from '../../entities/point-ledger.entity';
import { PointLedgerService } from './point-ledger.service';
import { PointLedgerController } from './point-ledger.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PointLedger])],
  controllers: [PointLedgerController],
  providers: [PointLedgerService],
  exports: [PointLedgerService],
})
export class PointLedgerModule {}
