import { Injectable } from '@nestjs/common';
import { localizeFaq, localizePage } from '../common/locale/cms-localize';
import type { AppLocale } from '../common/locale/locale.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PagesService } from '../modules/pages/pages.service';
import { SupportFaqsService } from '../modules/support-faqs/support-faqs.service';

@Injectable()
export class PublicCmsService {
  constructor(
    private readonly pagesService: PagesService,
    private readonly supportFaqsService: SupportFaqsService,
  ) {}

  async findFaqs(query: PaginationQueryDto, locale: AppLocale) {
    const data = await this.supportFaqsService.findAll({
      ...query,
      limit: query.limit ?? 50,
    });
    return {
      locale,
      items: data.items.map((faq) => localizeFaq(faq, locale)),
      total: data.total,
      page: data.page,
      limit: data.limit,
    };
  }

  async findPageByType(type: string, locale: AppLocale) {
    const page = await this.pagesService.findByType(type);
    return localizePage(page, locale);
  }
}
