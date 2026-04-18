import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Streak } from '../../entities/streak.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateStreakDto } from './dto/create-streak.dto';
import { UpdateStreakDto } from './dto/update-streak.dto';

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

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }
}
