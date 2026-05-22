import { Page } from '../../entities/page.entity';
import { SupportFaq } from '../../entities/support-faq.entity';
import { pickLocalizedField, pickLocalizedString, type AppLocale } from './locale.util';

export type LocalizedFaq = {
  id: string;
  locale: AppLocale;
  question: string;
  answer: string;
};

export type LocalizedPage = {
  id: string;
  type?: string;
  version?: string;
  updatedAt?: Date;
  locale: AppLocale;
  title: string;
  body: string;
};

export function localizeFaq(faq: SupportFaq, locale: AppLocale): LocalizedFaq {
  return {
    id: faq.id,
    locale,
    question: pickLocalizedString(faq.question as Record<string, unknown>, locale),
    answer: pickLocalizedString(faq.answer as Record<string, unknown>, locale),
  };
}

export function localizePage(page: Page, locale: AppLocale): LocalizedPage {
  const block = pickLocalizedField(page.locales as Record<string, unknown>, locale) as
    | { title?: string; body?: string }
    | undefined;

  return {
    id: page.id,
    type: page.type,
    version: page.version,
    updatedAt: page.updatedAt,
    locale,
    title: typeof block?.title === 'string' ? block.title : '',
    body: typeof block?.body === 'string' ? block.body : '',
  };
}
