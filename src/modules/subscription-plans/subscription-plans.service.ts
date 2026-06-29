import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { StripePlanSyncService } from '../billing/stripe/stripe-plan-sync.service';

@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly repo: Repository<SubscriptionPlan>,
    private readonly stripePlanSync: StripePlanSyncService,
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
    const { productId: _ignored, ...rest } = dto;
    this.logger.log(`Creating plan ${rest.id} (backendId=${(rest.features as any)?.backendId}, price=${rest.price})`);
    const stripeData = await this.stripePlanSync.syncPlan(rest as SubscriptionPlan);
    this.logger.log(`Stripe sync result for ${rest.id}: productId=${stripeData.productId}`);
    const entity = this.repo.create({
      ...rest,
      productId: stripeData.productId,
      features: stripeData.features,
    } as any);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto) {
    const existing = await this.findOne(id);
    const { productId: _ignored, ...rest } = dto;
    const merged = { ...existing, ...rest };
    this.logger.log(`Updating plan ${id} (backendId=${(merged.features as any)?.backendId}, price=${merged.price})`);
    const stripeData = await this.stripePlanSync.syncPlan(merged, existing);
    this.logger.log(`Stripe sync result for ${id}: productId=${stripeData.productId}`);
    Object.assign(existing, rest, {
      productId: stripeData.productId,
      features: stripeData.features,
    });
    return await this.repo.save(existing);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.stripePlanSync.deactivatePlanStripe(existing);
    await this.repo.softDelete(id);
    return { id };
  }
}
