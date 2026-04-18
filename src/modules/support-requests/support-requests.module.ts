import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportRequest } from '../../entities/support-request.entity';
import { SupportRequestsService } from './support-requests.service';
import { SupportRequestsController } from './support-requests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportRequest])],
  controllers: [SupportRequestsController],
  providers: [SupportRequestsService],
  exports: [SupportRequestsService],
})
export class SupportRequestsModule {}
