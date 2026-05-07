import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Streak } from '../../entities/streak.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateStreakDto } from './dto/create-streak.dto';
import { UpdateStreakDto } from './dto/update-streak.dto';

function calendarDayKey(date: Date, timeZone?: string | null): string {
  if (timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(date);
      const y = parts.find((p) => p.type === 'year')?.value;
      const m = parts.find((p) => p.type === 'month')?.value;
      const d = parts.find((p) => p.type === 'day')?.value;
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch {
      /* invalid tz → UTC fallback */
    }
  }
  return date.toISOString().slice(0, 10);
}

function daysBetweenCalendarKeys(previousDayKey: string, currentDayKey: string): number {
  const [py, pm, pd] = previousDayKey.split('-').map(Number);
  const [cy, cm, cd] = currentDayKey.split('-').map(Number);
  const prev = Date.UTC(py, pm - 1, pd);
  const cur = Date.UTC(cy, cm - 1, cd);
  return Math.round((cur - prev) / 86400000);
}

function isOnTime(completedAt: Date, dueAt: Date): boolean {
  return completedAt.getTime() <= dueAt.getTime();
}

@Injectable()
export class StreaksService {
  constructor(
    @InjectRepository(Streak)
    private readonly repo: Repository<Streak>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy, sortOrder } = query;
    const [items, total] = await this.repo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: sortBy ? { [sortBy]: (sortOrder ?? 'ASC') as any } : undefined,
      withDeleted: false,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Streak not found');
    return entity;
  }

  /** Existing streak or new row (count 0) keyed by user id. */
  async ensureForUser(userId: string): Promise<Streak> {
    let streak = await this.repo.findOne({ where: { id: userId } });
    if (!streak) {
      streak = this.repo.create({
        id: userId,
        count: 0,
        maxCount: 0,
        lastWasOnTime: undefined,
        lastActiveDate: undefined,
      } as Streak);
      streak = await this.repo.save(streak);
    }
    return streak;
  }

  /** Apply one completion for assignee; same calendar day does not increment count; gap resets. */
  async recordTaskCompletion(userId: string, params: { at: Date; dueAt?: Date | null; tz?: string | null }): Promise<Streak | null> {
    if (!userId) return null;

    const streak = await this.ensureForUser(userId);
    const tz = params.tz ?? undefined;
    const todayKey = calendarDayKey(params.at, tz);

    let lastKey: string | null = null;
    if (streak.lastActiveDate) {
      lastKey = calendarDayKey(new Date(streak.lastActiveDate), tz);
    }

    let nextCount = streak.count ?? 0;
    let nextLastWasOnTime = streak.lastWasOnTime;

    if (params.dueAt) {
      nextLastWasOnTime = isOnTime(params.at, new Date(params.dueAt));
    }

    if (!lastKey) {
      nextCount = 1;
    } else if (lastKey === todayKey) {
      /* already counted this calendar day */
      nextCount = streak.count ?? 1;
    } else {
      const gap = daysBetweenCalendarKeys(lastKey, todayKey);
      if (gap === 1) {
        nextCount = (streak.count ?? 0) + 1;
      } else {
        nextCount = 1;
      }
    }

    const nextMax = Math.max(streak.maxCount ?? 0, nextCount);

    streak.count = nextCount;
    streak.maxCount = nextMax;
    streak.lastActiveDate = params.at;
    streak.lastWasOnTime = nextLastWasOnTime;

    return await this.repo.save(streak);
  }

  async create(dto: CreateStreakDto) {
    const entity = this.repo.create({
      ...dto,
      lastActiveDate: dto.lastActiveDate ? new Date(dto.lastActiveDate) : undefined,
    } as any);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateStreakDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, {
      ...dto,
      lastActiveDate: (dto as any).lastActiveDate ? new Date((dto as any).lastActiveDate) : existing.lastActiveDate,
    });
    return await this.repo.save(existing);
  }

  async updateForUser(userId: string, dto: UpdateStreakDto) {
    await this.ensureForUser(userId);
    return this.update(userId, dto);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }
}
