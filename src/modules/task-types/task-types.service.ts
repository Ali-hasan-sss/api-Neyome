import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskType } from '../../entities/task-type.entity';
import { Family } from '../../entities/family.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateTaskTypeDto } from './dto/create-task-type.dto';
import { UpdateTaskTypeDto } from './dto/update-task-type.dto';
import { customTaskTypeCap } from '../subscription-plans/plan-limits';
import { SubscriptionPlansService } from '../subscription-plans/subscription-plans.service';
import { familyHasPaidAccess } from '../billing/stripe/family-plan.types';

@Injectable()
export class TaskTypesService {
  constructor(
    @InjectRepository(TaskType)
    private readonly repo: Repository<TaskType>,
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
    if (!entity) throw new NotFoundException('Task type not found');
    return entity;
  }

  async findOneForFamily(id: string, familyId: string) {
    const entity = await this.repo.findOne({ where: { id, familyId } });
    if (!entity) throw new NotFoundException('Task type not found');
    return entity;
  }

  async create(dto: CreateTaskTypeDto) {
    if (dto.familyId) {
      const family = await this.familyRepo.findOne({ where: { id: dto.familyId } });
      if (family) {
        const planState = (family.plan ?? {}) as { backendId?: string; status?: string; stripeSubscriptionId?: string | null };
        const backendId = planState.backendId?.trim() || 'free';
        const paid = familyHasPaidAccess(planState);
        const ownPlan = await this.subscriptionPlansService.findByBackendId(backendId);
        const limits = (paid ? ownPlan?.limits : ownPlan?.limits ?? (await this.subscriptionPlansService.getLimitsByBackendId('free'))) ?? {};
        const cap = customTaskTypeCap(limits, backendId, paid);
        if (cap === 0) {
          throw new BadRequestException('Custom task types are not available on your current plan');
        }
        if (cap != null) {
          const existing = await this.repo.count({ where: { familyId: dto.familyId } });
          if (existing >= cap) {
            throw new BadRequestException('Custom task type limit reached for your current plan');
          }
        }
      }
    }

    const { name, icon, ...fields } = dto;
    const entity = this.repo.create({
      ...fields,
      title: fields.title ?? (name ? { en: name } : undefined),
      emoji: fields.emoji ?? icon,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    } as any);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateTaskTypeDto) {
    const existing = await this.findOne(id);
    this.applyTaskTypePatch(existing, dto);
    return await this.repo.save(existing);
  }

  async updateForFamily(id: string, familyId: string, dto: UpdateTaskTypeDto) {
    const existing = await this.findOneForFamily(id, familyId);
    this.applyTaskTypePatch(existing, dto);
    return await this.repo.save(existing);
  }

  private applyTaskTypePatch(existing: TaskType, dto: UpdateTaskTypeDto) {
    const { name, icon, createdAt, ...fields } = dto;
    Object.assign(existing, {
      ...fields,
      title: fields.title ?? (name ? { en: name } : existing.title),
      emoji: fields.emoji ?? icon ?? existing.emoji,
      createdAt: createdAt ? new Date(createdAt) : existing.createdAt,
    });
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
