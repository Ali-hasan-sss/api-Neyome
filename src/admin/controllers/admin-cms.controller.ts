import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PagesService } from '../../modules/pages/pages.service';
import { CreatePageDto } from '../../modules/pages/dto/create-page.dto';
import { UpdatePageDto } from '../../modules/pages/dto/update-page.dto';
import { SubscriptionPlansService } from '../../modules/subscription-plans/subscription-plans.service';
import { CreateSubscriptionPlanDto } from '../../modules/subscription-plans/dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../../modules/subscription-plans/dto/update-subscription-plan.dto';
import { SupportFaqsService } from '../../modules/support-faqs/support-faqs.service';
import { CreateSupportFaqDto } from '../../modules/support-faqs/dto/create-support-faq.dto';
import { UpdateSupportFaqDto } from '../../modules/support-faqs/dto/update-support-faq.dto';
import { SupportCategoriesService } from '../../modules/support-categories/support-categories.service';
import { CreateSupportCategoryDto } from '../../modules/support-categories/dto/create-support-category.dto';
import { UpdateSupportCategoryDto } from '../../modules/support-categories/dto/update-support-category.dto';
import { SupportRequestsService } from '../../modules/support-requests/support-requests.service';
import { UpdateSupportRequestDto } from '../../modules/support-requests/dto/update-support-request.dto';
import { DailyQuotesService } from '../../modules/daily-quotes/daily-quotes.service';
import { DailyQuoteDto } from '../../modules/daily-quotes/dto/daily-quote.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('Admin CMS')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('admin-jwt')
@Controller('admin')
export class AdminCmsController {
  constructor(
    private readonly pagesService: PagesService,
    private readonly plansService: SubscriptionPlansService,
    private readonly faqsService: SupportFaqsService,
    private readonly categoriesService: SupportCategoriesService,
    private readonly requestsService: SupportRequestsService,
    private readonly quotesService: DailyQuotesService,
  ) {}

  // --- Subscription plans ---
  @Get('subscription-plans')
  listPlans(@Query() query: PaginationQueryDto) {
    return this.plansService.findAll(query).then((data) => ({ success: true, data, message: 'Plans fetched' }));
  }

  @Get('subscription-plans/:id')
  getPlan(@Param('id') id: string) {
    return this.plansService.findOne(id).then((data) => ({ success: true, data, message: 'Plan fetched' }));
  }

  @Post('subscription-plans')
  createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.plansService.create(dto).then((data) => ({ success: true, data, message: 'Plan created' }));
  }

  @Patch('subscription-plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.plansService.update(id, dto).then((data) => ({ success: true, data, message: 'Plan updated' }));
  }

  @Delete('subscription-plans/:id')
  deletePlan(@Param('id') id: string) {
    return this.plansService.remove(id).then((data) => ({ success: true, data, message: 'Plan deleted' }));
  }

  // --- Pages ---
  @Get('pages')
  @ApiQuery({ name: 'type', required: false })
  listPages(@Query() query: PaginationQueryDto & { type?: string }) {
    return this.pagesService.findAll(query).then((data) => ({ success: true, data, message: 'Pages fetched' }));
  }

  @Get('pages/type/:type')
  getPageByType(@Param('type') type: string) {
    return this.pagesService.findByType(type).then((data) => ({ success: true, data, message: 'Page fetched' }));
  }

  @Get('pages/:id')
  getPage(@Param('id') id: string) {
    return this.pagesService.findOne(id).then((data) => ({ success: true, data, message: 'Page fetched' }));
  }

  @Post('pages')
  createPage(@Body() dto: CreatePageDto) {
    return this.pagesService.create(dto).then((data) => ({ success: true, data, message: 'Page created' }));
  }

  @Patch('pages/:id')
  updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pagesService.update(id, dto).then((data) => ({ success: true, data, message: 'Page updated' }));
  }

  @Delete('pages/:id')
  deletePage(@Param('id') id: string) {
    return this.pagesService.remove(id).then((data) => ({ success: true, data, message: 'Page deleted' }));
  }

  // --- FAQs ---
  @Get('support-faqs')
  listFaqs(@Query() query: PaginationQueryDto) {
    return this.faqsService.findAll(query).then((data) => ({ success: true, data, message: 'FAQs fetched' }));
  }

  @Get('support-faqs/:id')
  getFaq(@Param('id') id: string) {
    return this.faqsService.findOne(id).then((data) => ({ success: true, data, message: 'FAQ fetched' }));
  }

  @Post('support-faqs')
  createFaq(@Body() dto: CreateSupportFaqDto) {
    return this.faqsService.create(dto).then((data) => ({ success: true, data, message: 'FAQ created' }));
  }

  @Patch('support-faqs/:id')
  updateFaq(@Param('id') id: string, @Body() dto: UpdateSupportFaqDto) {
    return this.faqsService.update(id, dto).then((data) => ({ success: true, data, message: 'FAQ updated' }));
  }

  @Delete('support-faqs/:id')
  deleteFaq(@Param('id') id: string) {
    return this.faqsService.remove(id).then((data) => ({ success: true, data, message: 'FAQ deleted' }));
  }

  // --- Support categories ---
  @Get('support-categories')
  listCategories(@Query() query: PaginationQueryDto) {
    return this.categoriesService.findAll(query).then((data) => ({ success: true, data, message: 'Categories fetched' }));
  }

  @Post('support-categories')
  createCategory(@Body() dto: CreateSupportCategoryDto) {
    return this.categoriesService.create(dto).then((data) => ({ success: true, data, message: 'Category created' }));
  }

  @Patch('support-categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateSupportCategoryDto) {
    return this.categoriesService.update(id, dto).then((data) => ({ success: true, data, message: 'Category updated' }));
  }

  @Delete('support-categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.remove(id).then((data) => ({ success: true, data, message: 'Category deleted' }));
  }

  // --- Support requests ---
  @Get('support-requests')
  listRequests(@Query() query: PaginationQueryDto) {
    return this.requestsService.findAll(query).then((data) => ({ success: true, data, message: 'Requests fetched' }));
  }

  @Patch('support-requests/:id')
  updateRequest(@Param('id') id: string, @Body() dto: UpdateSupportRequestDto) {
    return this.requestsService.update(id, dto).then((data) => ({ success: true, data, message: 'Request updated' }));
  }

  @Delete('support-requests/:id')
  deleteRequest(@Param('id') id: string) {
    return this.requestsService.remove(id).then((data) => ({ success: true, data, message: 'Request deleted' }));
  }

  // --- Daily quotes ---
  @Get('daily-quotes')
  listQuotes(@Query() query: PaginationQueryDto) {
    return this.quotesService.findAll(query).then((data) => ({ success: true, data, message: 'Quotes fetched' }));
  }

  @Post('daily-quotes')
  createQuote(@Body() dto: DailyQuoteDto) {
    return this.quotesService.create(dto).then((data) => ({ success: true, data, message: 'Quote created' }));
  }

  @Patch('daily-quotes/:id')
  updateQuote(@Param('id') id: string, @Body() dto: DailyQuoteDto) {
    return this.quotesService.update(id, dto).then((data) => ({ success: true, data, message: 'Quote updated' }));
  }

  @Delete('daily-quotes/:id')
  deleteQuote(@Param('id') id: string) {
    return this.quotesService.remove(id).then((data) => ({ success: true, data, message: 'Quote deleted' }));
  }
}
