import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyQuote } from '../../entities/daily-quote.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DailyQuoteDto } from './dto/daily-quote.dto';

@Injectable()
export class DailyQuotesService {
  constructor(
    @InjectRepository(DailyQuote)
    private readonly repo: Repository<DailyQuote>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy, sortOrder } = query;
    const [items, total] = await this.repo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: sortBy ? { [sortBy]: (sortOrder ?? 'ASC') as any } : { id: 'ASC' },
      withDeleted: false,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Daily quote not found');
    return entity;
  }

  async create(dto: DailyQuoteDto) {
    const entity = this.repo.create({
      id: dto.id,
      text: dto.text,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
    });
    return await this.repo.save(entity);
  }

  async update(id: string, dto: DailyQuoteDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, {
      text: dto.text ?? existing.text,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : existing.createdAt,
    });
    return await this.repo.save(existing);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
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
