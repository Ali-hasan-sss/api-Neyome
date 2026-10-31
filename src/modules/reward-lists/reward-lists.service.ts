import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardList } from '../../entities/reward-list.entity';
import { Family } from '../../entities/family.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateRewardListDto } from './dto/create-reward-list.dto';
import { UpdateRewardListDto } from './dto/update-reward-list.dto';
import { SubscriptionPlansService } from '../subscription-plans/subscription-plans.service';
import { familyHasPaidAccess } from '../billing/stripe/family-plan.types';
import { readNumericLimit } from '../subscription-plans/plan-limits';

@Injectable()
export class RewardListsService {
  constructor(
    @InjectRepository(RewardList)
    private readonly repo: Repository<RewardList>,
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    private readonly subscriptionPlansService: SubscriptionPlansService,
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

  async findAllForFamily(familyId: string, query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy, sortOrder } = query;
    const [items, total] = await this.repo.findAndCount({
      where: { familyId },
      take: limit,
      skip: (page - 1) * limit,
      order: sortBy ? { [sortBy]: (sortOrder ?? 'ASC') as any } : undefined,
      withDeleted: false,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Reward list not found');
    return entity;
  }

  async findOneForFamily(id: string, familyId: string) {
    const entity = await this.repo.findOne({ where: { id, familyId } });
    if (!entity) throw new NotFoundException('Reward list not found');
    return entity;
  }

  async create(dto: CreateRewardListDto) {
    await this.assertRewardListLimit(dto.familyId);
    const entity = this.repo.create({
      ...dto,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    } as any);
    return await this.repo.save(entity);
  }

  private async assertRewardListLimit(familyId?: string) {
    if (!familyId) return;
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) return;
    const planState = (family.plan ?? {}) as {
      backendId?: string;
      status?: string;
      stripeSubscriptionId?: string | null;
    };
    const backendId = planState.backendId?.trim() || 'free';
    const paid = familyHasPaidAccess(planState);
    const ownPlan = await this.subscriptionPlansService.findByBackendId(backendId);
    const limits = (ownPlan?.limits ??
      (paid ? {} : await this.subscriptionPlansService.getLimitsByBackendId('free'))) as Record<string, unknown>;
    let maxRewards = readNumericLimit(limits, ['rewardsPerDay', 'rewards']);
    if (maxRewards == null && !paid) maxRewards = 10;
    if (maxRewards == null) return;

    const count = await this.repo.count({ where: { familyId } });
    if (count >= maxRewards) {
      throw new BadRequestException('Rewards limit reached for your current plan');
    }
  }

  async update(id: string, dto: UpdateRewardListDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, {
      ...dto,
      createdAt: (dto as any).createdAt ? new Date((dto as any).createdAt) : existing.createdAt,
    });
    return await this.repo.save(existing);
  }

  async updateForFamily(id: string, familyId: string, dto: UpdateRewardListDto) {
    const existing = await this.findOneForFamily(id, familyId);
    Object.assign(existing, {
      ...dto,
      createdAt: (dto as any).createdAt ? new Date((dto as any).createdAt) : existing.createdAt,
    });
    return await this.repo.save(existing);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }

  async removeForFamily(id: string, familyId: string) {
    const entity = await this.findOneForFamily(id, familyId);
    await this.repo.softDelete(entity.id);
    return { id: entity.id };
  }
}
