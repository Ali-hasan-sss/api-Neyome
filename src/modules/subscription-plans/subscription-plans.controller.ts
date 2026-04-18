import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlansService } from './subscription-plans.service';

@UseGuards(ApiKeyGuard)
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly service: SubscriptionPlansService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service
      .findAll(query)
      .then((data) => ({ success: true, data, message: 'Subscription plans fetched' }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id).then((data) => ({ success: true, data, message: 'Subscription plan fetched' }));
  }

  @Post()
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.service.create(dto).then((data) => ({ success: true, data, message: 'Subscription plan created' }));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.service
      .update(id, dto)
      .then((data) => ({ success: true, data, message: 'Subscription plan updated' }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id).then((data) => ({ success: true, data, message: 'Subscription plan deleted' }));
  }
}
