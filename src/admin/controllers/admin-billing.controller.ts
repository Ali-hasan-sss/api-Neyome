import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminGuard } from '../guards/admin.guard';
import { AdminBillingService } from '../admin-billing.service';

@ApiTags('Admin Billing')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('admin-jwt')
@Controller('admin')
export class AdminBillingController {
  constructor(private readonly billingService: AdminBillingService) {}

  @Get('subscriptions')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listSubscriptions(@Query() query: PaginationQueryDto) {
    return this.billingService
      .listFamilySubscriptions(query)
      .then((data) => ({ success: true, data, message: 'Subscriptions fetched' }));
  }

  @Get('billing/payments')
  @ApiQuery({ name: 'limit', required: false })
  listPayments(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 30;
    return this.billingService
      .listStripePayments(n)
      .then((data) => ({ success: true, data, message: 'Payments fetched' }));
  }
}
