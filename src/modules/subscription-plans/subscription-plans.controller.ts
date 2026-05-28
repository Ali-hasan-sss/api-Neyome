import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlansService } from './subscription-plans.service';

@ApiTags('Subscription Plans')
@UseGuards(ApiKeyGuard)
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly service: SubscriptionPlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all subscription plans' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'sortBy', required: false, example: 'sort' })
  @ApiQuery({ name: 'sortOrder', required: false, example: 'ASC' })
  @ApiOkResponse({ description: 'Paginated list of subscription plans' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service
      .findAll(query)
      .then((data) => ({ success: true, data, message: 'Subscription plans fetched' }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single subscription plan by ID' })
  @ApiParam({ name: 'id', description: 'Plan UUID' })
  @ApiOkResponse({ description: 'Subscription plan details' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id).then((data) => ({ success: true, data, message: 'Subscription plan fetched' }));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiBody({ type: CreateSubscriptionPlanDto })
  @ApiOkResponse({ description: 'Subscription plan created successfully' })
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.service.create(dto).then((data) => ({ success: true, data, message: 'Subscription plan created' }));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan UUID' })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  @ApiOkResponse({ description: 'Subscription plan updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.service
      .update(id, dto)
      .then((data) => ({ success: true, data, message: 'Subscription plan updated' }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subscription plan (soft delete)' })
  @ApiParam({ name: 'id', description: 'Plan UUID' })
  @ApiOkResponse({ description: 'Subscription plan deleted successfully' })
  remove(@Param('id') id: string) {
    return this.service.remove(id).then((data) => ({ success: true, data, message: 'Subscription plan deleted' }));
  }
}
