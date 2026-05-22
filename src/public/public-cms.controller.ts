import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RequestLocale } from '../common/locale/locale.decorator';
import type { AppLocale } from '../common/locale/locale.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PublicCmsService } from './public-cms.service';

/**
 * Unauthenticated read-only CMS endpoints for mobile/web clients.
 * No API key or JWT required.
 * Locale: send `X-Locale: ar` or `Accept-Language: ar` (supported: en, ar, de).
 */
@ApiTags('Public')
@Controller('public')
export class PublicCmsController {
  constructor(private readonly publicCms: PublicCmsService) {}

  @Get('support-faqs')
  @ApiOperation({
    summary: 'List FAQs (public, localized)',
    description:
      'Returns `question` and `answer` as strings in the requested locale. Use header `X-Locale` or `Accept-Language` (en, ar, de). Falls back to `en` then first available.',
  })
  @ApiHeader({ name: 'X-Locale', required: false, description: 'Preferred locale: en | ar | de' })
  @ApiHeader({ name: 'Accept-Language', required: false, description: 'RFC 7231 language list' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiOkResponse({ description: 'Paginated localized FAQ list' })
  findFaqs(@Query() query: PaginationQueryDto, @RequestLocale() locale: AppLocale) {
    return this.publicCms.findFaqs(query, locale).then((data) => ({
      success: true,
      data,
      message: 'FAQs fetched',
    }));
  }

  @Get('pages/privacy')
  @ApiOperation({ summary: 'Privacy policy (public, localized)' })
  @ApiHeader({ name: 'X-Locale', required: false })
  @ApiHeader({ name: 'Accept-Language', required: false })
  @ApiOkResponse({ description: 'Localized privacy policy' })
  privacy(@RequestLocale() locale: AppLocale) {
    return this.publicCms.findPageByType('privacy', locale).then((data) => ({
      success: true,
      data,
      message: 'Privacy policy fetched',
    }));
  }

  @Get('pages/terms')
  @ApiOperation({ summary: 'Terms of use (public, localized)' })
  @ApiHeader({ name: 'X-Locale', required: false })
  @ApiHeader({ name: 'Accept-Language', required: false })
  @ApiOkResponse({ description: 'Localized terms of use' })
  terms(@RequestLocale() locale: AppLocale) {
    return this.publicCms.findPageByType('terms', locale).then((data) => ({
      success: true,
      data,
      message: 'Terms of use fetched',
    }));
  }

  @Get('pages/:type')
  @ApiOperation({ summary: 'CMS page by type (public, localized)' })
  @ApiHeader({ name: 'X-Locale', required: false })
  @ApiHeader({ name: 'Accept-Language', required: false })
  @ApiParam({ name: 'type', example: 'privacy' })
  pageByType(@Param('type') type: string, @RequestLocale() locale: AppLocale) {
    return this.publicCms.findPageByType(type, locale).then((data) => ({
      success: true,
      data,
      message: 'Page fetched',
    }));
  }
}
