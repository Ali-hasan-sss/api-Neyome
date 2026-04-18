import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyQuote } from '../../entities/daily-quote.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DailyQuotesService {
  private readonly logger = new Logger(DailyQuotesService.name);
  private seeded = false;

  constructor(
    @InjectRepository(DailyQuote)
    private readonly repo: Repository<DailyQuote>,
  ) {
    // Seed asynchronously on startup (best-effort)
    this.seedFromSchemaJson().catch((err) => {
      this.logger.warn(`Daily quotes seed skipped/failed: ${err?.message ?? err}`);
    });
  }

  private parseFirestoreTimestamp(value: any): Date | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? undefined : d;
    }
    if (typeof value === 'object' && value.__datatype === 'timestamp' && value.value) {
      const d = new Date(value.value);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  }

  private async seedFromSchemaJson(): Promise<void> {
    if (this.seeded) return;

    const schemaPath = path.join(process.cwd(), 'schema.json');
    if (!fs.existsSync(schemaPath)) {
      this.seeded = true;
      return;
    }

    const raw = fs.readFileSync(schemaPath, 'utf8');
    const json = JSON.parse(raw);

    const dailyQuotes = json?.__collections?.daily_quotes;
    if (!dailyQuotes || typeof dailyQuotes !== 'object') {
      this.seeded = true;
      return;
    }

    const items: DailyQuote[] = [];
    for (const [id, docWrapper] of Object.entries<any>(dailyQuotes)) {
      const doc = docWrapper?.__doc;
      if (!doc) continue;

      items.push(
        this.repo.create({
          id,
          text: typeof doc.text === 'string' ? doc.text : undefined,
          createdAt: this.parseFirestoreTimestamp(doc.createdAt),
        }),
      );
    }

    if (items.length === 0) {
      this.seeded = true;
      return;
    }

    // Idempotent upsert via primary key (save will insert/update)
    await this.repo.save(items, { chunk: 500 });
    this.seeded = true;
    this.logger.log(`Daily quotes seeded: ${items.length}`);
  }

  private dayOfYear(date: Date): number {
    const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const current = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const diffDays = Math.floor((current.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays + 1;
  }

  async getQuoteForDate(date: Date): Promise<DailyQuote | null> {
    const count = await this.repo.count({ where: {} });
    if (count === 0) return null;

    const index = (this.dayOfYear(date) - 1) % count;

    const rows = await this.repo.find({
      take: 1,
      skip: index,
      order: { id: 'ASC' as any },
    });

    return rows[0] ?? null;
  }

  async getTodayQuote(dateOverride?: string): Promise<DailyQuote | null> {
    const date = dateOverride ? new Date(dateOverride) : new Date();
    if (isNaN(date.getTime())) {
      return this.getQuoteForDate(new Date());
    }
    return this.getQuoteForDate(date);
  }
}
