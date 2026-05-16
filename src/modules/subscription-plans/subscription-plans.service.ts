import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name);
  private seeded = false;

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly repo: Repository<SubscriptionPlan>,
  ) {
    // Seed asynchronously on startup (best-effort, idempotent)
    this.seedDefaultPlans().catch((err) => {
      this.logger.warn(`Subscription plans seed skipped/failed: ${err?.message ?? err}`);
    });
  }

  private defaultPlans(): SubscriptionPlan[] {
    const nowLimitsVersion = 1;

    return [
      {
        id: '00000000-0000-0000-0000-000000000001',
        sort: 1,
        title: { en: 'Free' },
        subtitle: { en: 'Basic plan' },
        periodShort: { en: '' },
        productId: null,
        badge: null,
        features: {
          backendId: 'free',
          billing: 'none',
          providers: [],
        },
        limitsVersion: nowLimitsVersion,
        limits: {
          familyMembers: 3,
          rewards: 5,
          taskTypes: 5,
          tasksPerDay: 5,
        },
      } as any,
      {
        id: '00000000-0000-0000-0000-000000000002',
        sort: 2,
        title: { en: 'Pro' },
        subtitle: { en: 'Monthly' },
        periodShort: { en: 'mo' },
        productId: 'neyome_premium_monthly',
        badge: { en: 'Popular' },
        features: {
          backendId: 'family_pro_monthly',
          billing: 'monthly',
          providers: ['stripe', 'paypal'],
          stripe: {
            productId: 'Neyome Pro',
            priceId: 'neyome_premium_monthly',
            amount: 2,
            currency: 'EUR',
          },
          paypal: {
            productId: 'Neyome Pro',
            planId: 'neyome_premium_monthly',
          },
        },
        limitsVersion: nowLimitsVersion,
        limits: {
          familyMembers: 10,
          rewards: null,
          taskTypes: 'extended',
          tasksPerDay: 'extended',
        },
      } as any,
      {
        id: '00000000-0000-0000-0000-000000000003',
        sort: 3,
        title: { en: 'Pro' },
        subtitle: { en: 'Yearly' },
        periodShort: { en: 'yr' },
        productId: 'neyome_premium_yearly',
        badge: { en: 'Best value' },
        features: {
          backendId: 'family_pro_yearly',
          billing: 'yearly',
          providers: ['stripe', 'paypal'],
          stripe: {
            productId: 'Neyome Pro',
            priceId: 'neyome_premium_yearly',
            amount: 20,
            currency: 'EUR',
          },
          paypal: {
            productId: 'Neyome Pro',
            planId: 'neyome_premium_yearly',
          },
        },
        limitsVersion: nowLimitsVersion,
        limits: {
          familyMembers: 10,
          rewards: null,
          taskTypes: 10,
          tasksPerDay: 10,
        },
      } as any,
    ];
  }

  private async seedDefaultPlans(): Promise<void> {
    if (this.seeded) return;

    const items = this.defaultPlans();
    await this.repo.save(items);
    this.seeded = true;
    this.logger.log(`Subscription plans seeded: ${items.length}`);
  }

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
    if (!entity) throw new NotFoundException('Subscription plan not found');
    return entity;
  }

  async findByBackendId(backendId: string): Promise<SubscriptionPlan | null> {
    const entity = await this.repo.findOne({
      where: {
        features: Raw((alias) => `${alias} ->> 'backendId' = :backendId`, { backendId }),
      } as any,
    });
    return entity ?? null;
  }

  async getLimitsByBackendId(backendId?: string | null): Promise<any> {
    const key = backendId?.trim() ? backendId.trim() : 'free';
    const plan = (await this.findByBackendId(key)) ?? (await this.findByBackendId('free'));
    return plan?.limits ?? {};
  }

  async create(dto: CreateSubscriptionPlanDto) {
    const entity = this.repo.create(dto as any);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, dto);
    return await this.repo.save(existing);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }
}
