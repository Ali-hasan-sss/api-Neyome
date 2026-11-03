import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from '../../entities/family.entity';
import { User } from '../../entities/user.entity';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { AccountDeletionService } from './account-deletion.service';
import { StripeBillingModule } from '../billing/stripe/stripe-billing.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [TypeOrmModule.forFeature([Family, User]), StripeBillingModule, UploadsModule],
  controllers: [FamiliesController],
  providers: [FamiliesService, AccountDeletionService],
  exports: [FamiliesService, AccountDeletionService],
})
export class FamiliesModule {}
