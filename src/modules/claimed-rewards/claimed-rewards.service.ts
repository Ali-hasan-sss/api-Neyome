import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimedReward } from '../../entities/claimed-reward.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateClaimedRewardDto } from './dto/create-claimed-reward.dto';
import { UpdateClaimedRewardDto } from './dto/update-claimed-reward.dto';

@Injectable()
export class ClaimedRewardsService {
  constructor(
    @InjectRepository(ClaimedReward)
    private readonly repo: Repository<ClaimedReward>,
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
    if (!entity) throw new NotFoundException('ClaimedReward not found');
    return entity;
  }

  async findOneForUser(id: string, userId: string) {
    const entity = await this.repo.findOne({ where: { id, userId } });
    if (!entity) throw new NotFoundException('ClaimedReward not found');
    return entity;
  }

  async create(dto: CreateClaimedRewardDto) {
    const entity = this.repo.create({
      ...dto,
      claimedAt: dto.claimedAt ? new Date(dto.claimedAt) : undefined,
    } as any);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateClaimedRewardDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, {
      ...dto,
      claimedAt: (dto as any).claimedAt ? new Date((dto as any).claimedAt) : existing.claimedAt,
    });
    return await this.repo.save(existing);
  }

  async updateForUser(id: string, userId: string, dto: UpdateClaimedRewardDto) {
    const existing = await this.findOneForUser(id, userId);
    Object.assign(existing, {
      ...dto,
      claimedAt: (dto as any).claimedAt ? new Date((dto as any).claimedAt) : existing.claimedAt,
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
