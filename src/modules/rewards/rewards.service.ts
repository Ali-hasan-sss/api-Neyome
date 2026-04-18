import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../../entities/reward.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private readonly repo: Repository<Reward>,
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

  async findAllForUser(userId: string, query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy, sortOrder } = query;
    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      order: sortBy ? { [sortBy]: (sortOrder ?? 'ASC') as any } : undefined,
      withDeleted: false,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Reward not found');
    return entity;
  }

  async findOneForUser(id: string, userId: string) {
    const entity = await this.repo.findOne({ where: { id, userId } });
    if (!entity) throw new NotFoundException('Reward not found');
    return entity;
  }

  async create(dto: CreateRewardDto) {
    const entity = this.repo.create({
      ...dto,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      dayClaimed: dto.dayClaimed ? new Date(dto.dayClaimed) : undefined,
    } as any);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateRewardDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, {
      ...dto,
      createdAt: (dto as any).createdAt ? new Date((dto as any).createdAt) : existing.createdAt,
      dayClaimed: (dto as any).dayClaimed ? new Date((dto as any).dayClaimed) : existing.dayClaimed,
    });
    return await this.repo.save(existing);
  }

  async updateForUser(id: string, userId: string, dto: UpdateRewardDto) {
    const existing = await this.findOneForUser(id, userId);
    Object.assign(existing, {
      ...dto,
      createdAt: (dto as any).createdAt ? new Date((dto as any).createdAt) : existing.createdAt,
      dayClaimed: (dto as any).dayClaimed ? new Date((dto as any).dayClaimed) : existing.dayClaimed,
    });
    return await this.repo.save(existing);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }

  async removeForUser(id: string, userId: string) {
    const entity = await this.findOneForUser(id, userId);
    await this.repo.softDelete(entity.id);
    return { id: entity.id };
  }
}
