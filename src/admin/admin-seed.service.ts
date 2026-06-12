import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ObjectLiteral, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Page } from '../entities/page.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { SupportFaq } from '../entities/support-faq.entity';
import { SupportCategory } from '../entities/support-category.entity';
import { SupportRequest } from '../entities/support-request.entity';
import { DailyQuote } from '../entities/daily-quote.entity';
import { resolveEntityId } from '../database/stable-id';

type FirestoreTimestamp = { _seconds: number; _nanoseconds?: number };

function parseFirestoreDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return new Date(value);
  const ts = value as FirestoreTimestamp;
  if (typeof ts._seconds === 'number') return new Date(ts._seconds * 1000);
  return undefined;
}

function loadFirebaseExport(): Record<string, unknown> {
  const candidates = [
    path.join(process.cwd(), 'firebase-export.json'),
    path.join(process.cwd(), '..', 'firebase-export.json'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) {
    throw new Error('firebase-export.json not found in project root');
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
}

@Injectable()
export class AdminSeedService {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Page) private readonly pageRepo: Repository<Page>,
    @InjectRepository(SubscriptionPlan) private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(SupportFaq) private readonly faqRepo: Repository<SupportFaq>,
    @InjectRepository(SupportCategory) private readonly categoryRepo: Repository<SupportCategory>,
    @InjectRepository(SupportRequest) private readonly requestRepo: Repository<SupportRequest>,
    @InjectRepository(DailyQuote) private readonly quoteRepo: Repository<DailyQuote>,
  ) {}

  async run(): Promise<{ adminEmail: string; seeded: Record<string, number> }> {
    const reset = this.configService.get<string>('SEED_RESET') === 'true';

    this.logger.log(
      'Users table: never bulk-deleted. Only ADMIN_EMAIL account is created or updated (no duplicate emails).',
    );

    if (reset) {
      await this.requestRepo.createQueryBuilder().delete().execute();
      await this.faqRepo.createQueryBuilder().delete().execute();
      await this.categoryRepo.createQueryBuilder().delete().execute();
      await this.quoteRepo.createQueryBuilder().delete().execute();
      await this.pageRepo.createQueryBuilder().delete().execute();
      await this.planRepo.createQueryBuilder().delete().execute();
      this.logger.warn('SEED_RESET=true: CMS tables cleared (users table untouched)');
    } else {
      this.logger.log('SEED_RESET not set: CMS rows upserted by id (no duplicate primary keys)');
    }

    const data = loadFirebaseExport();
    const seeded: Record<string, number> = {};

    seeded.subscription_plans = await this.seedSubscriptionPlans(data, reset);
    seeded.pages = await this.seedPages(data, reset);
    seeded.support_categories = await this.seedSupportCategories(data, reset);
    seeded.support_faqs = await this.seedSupportFaqs(data, reset);
    seeded.support_requests = await this.seedSupportRequests(data, reset);
    seeded.daily_quotes = await this.seedDailyQuotes(data, reset);

    const adminEmail = await this.seedAdminUser();
    this.logger.log(`Admin seed complete: ${JSON.stringify(seeded)}`);
    return { adminEmail, seeded };
  }

  /** Insert after reset, upsert otherwise — never creates duplicate rows by primary key. */
  private async persistById<T extends ObjectLiteral>(
    repo: Repository<T>,
    entities: T[],
    reset: boolean,
  ): Promise<number> {
    if (entities.length === 0) return 0;
    if (reset) {
      await repo.save(entities);
    } else {
      await repo.upsert(entities, { conflictPaths: ['id'] as any });
    }
    return entities.length;
  }

  private async seedAdminUser(): Promise<string> {
    const email = this.configService.get<string>('ADMIN_EMAIL') || 'admin@neyome.com';
    const password = this.configService.get<string>('ADMIN_PASSWORD') || 'Admin123!ChangeMe';
    const name = this.configService.get<string>('ADMIN_NAME') || 'Neyome Admin';

    let user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    const hashed = await bcrypt.hash(password, 10);

    if (user) {
      user.isAdmin = true;
      user.isParent = false;
      user.password = hashed;
      user.name = name;
      user.updatedAt = new Date();
      await this.userRepo.save(user);
      this.logger.log(`Admin user updated: ${email}`);
      return email;
    }

    user = this.userRepo.create({
      id: crypto.randomUUID(),
      email,
      password: hashed,
      name,
      isAdmin: true,
      isParent: false,
      locale: 'en',
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.userRepo.save(user);
    this.logger.log(`Admin user created: ${email}`);
    return email;
  }

  private async seedSubscriptionPlans(data: Record<string, unknown>, reset: boolean): Promise<number> {
    const plans = (data.subscription_plans as Record<string, unknown>[]) ?? [];
    const limitsMap = new Map(
      ((data.Subscription_plans as { id: string; limits?: unknown; limitsVersion?: number }[]) ?? []).map(
        (p) => [p.id, p],
      ),
    );

    const entities = plans.map((p) => {
      const firebaseId = p.id as string;
      const extra = limitsMap.get(firebaseId);
      const features =
        p.features && typeof p.features === 'object' && !Array.isArray(p.features)
          ? { ...(p.features as object), backendId: (p.features as any).backendId ?? firebaseId }
          : { backendId: firebaseId, marketing: p.features };
      return this.planRepo.create({
        id: resolveEntityId('subscription_plan', firebaseId),
        badge: p.badge,
        features,
        productId: (p.productId as string) ?? null,
        subtitle: p.subtitle,
        sort: p.sort as number,
        title: p.title,
        periodShort: p.periodShort,
        price: p.price != null ? Number(p.price) : null,
        currency: (p.currency as string) ?? 'USD',
        limitsVersion: (extra?.limitsVersion ?? p.limitsVersion) as number,
        limits: extra?.limits ?? p.limits,
      });
    });

    return this.persistById(this.planRepo, entities, reset);
  }

  private async seedPages(data: Record<string, unknown>, reset: boolean): Promise<number> {
    const pages = (data.pages as Record<string, unknown>[]) ?? [];
    const entities = pages.map((p) =>
      this.pageRepo.create({
        id: resolveEntityId('page', p.id as string),
        cards: p.cards,
        content: p.content,
        locales: p.locales,
        type: (p.type as string) ?? (p.id as string),
        version: p.version as string,
        updatedAt: parseFirestoreDate(p.updatedAt),
      }),
    );
    return this.persistById(this.pageRepo, entities, reset);
  }

  private async seedSupportCategories(data: Record<string, unknown>, reset: boolean): Promise<number> {
    const items = (data.support_categories as Record<string, unknown>[]) ?? [];
    const entities = items.map((c) =>
      this.categoryRepo.create({
        id: resolveEntityId('support_category', c.id as string),
        name_de: c.name_de as string,
        name_ar: c.name_ar as string,
        name_en: c.name_en as string,
      }),
    );
    return this.persistById(this.categoryRepo, entities, reset);
  }

  private async seedSupportFaqs(data: Record<string, unknown>, reset: boolean): Promise<number> {
    const items = (data.support_faqs as Record<string, unknown>[]) ?? [];
    const entities = items.map((f) =>
      this.faqRepo.create({
        id: resolveEntityId('support_faq', f.id as string),
        question: f.question,
        answer: f.answer,
      }),
    );
    return this.persistById(this.faqRepo, entities, reset);
  }

  private async seedSupportRequests(data: Record<string, unknown>, reset: boolean): Promise<number> {
    const items = (data.support_requests as Record<string, unknown>[]) ?? [];
    const entities = items.map((r) =>
      this.requestRepo.create({
        id: resolveEntityId('support_request', r.id as string),
        createdAt: parseFirestoreDate(r.createdAt),
        attachmentUrl: (r.attachmentUrl as string) ?? null,
        name: r.name as string,
        message: r.message as string,
        categoryName: r.categoryName as string,
        email: r.email as string,
        categoryId: r.categoryId
          ? resolveEntityId('support_category', r.categoryId as string)
          : undefined,
      }),
    );
    return this.persistById(this.requestRepo, entities, reset);
  }

  private async seedDailyQuotes(data: Record<string, unknown>, reset: boolean): Promise<number> {
    const items = (data.daily_quotes as Record<string, unknown>[]) ?? [];
    const entities = items.map((q) =>
      this.quoteRepo.create({
        id: q.id as string,
        text: q.text as string,
        createdAt: parseFirestoreDate(q.createdAt),
      }),
    );
    return this.persistById(this.quoteRepo, entities, reset);
  }
}
