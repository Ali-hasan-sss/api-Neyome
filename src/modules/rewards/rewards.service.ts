import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Reward } from '../../entities/reward.entity';
import { User } from '../../entities/user.entity';
import { PointLedger } from '../../entities/point-ledger.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward)
    private readonly repo: Repository<Reward>,
  ) {}

  /** Claimed / redeemed slot — includes `fulfilled` when apps mark delivery without `earned`/`dayClaimed`. */
  private isClaimed(r: Pick<Reward, 'dayClaimed' | 'earned' | 'fulfilled'>): boolean {
    if (r.fulfilled === true) return true;
    if (r.earned === true) return true;
    return r.dayClaimed != null;
  }

  /** Net change to user.points: negative debits, positive credits. */
  private obligationBalanceDelta(wasClaimed: boolean, oldPoints: number, nowClaimed: boolean, newPoints: number): number {
    const obligationBefore = wasClaimed ? oldPoints : 0;
    const obligationAfter = nowClaimed ? newPoints : 0;
    return -(obligationAfter - obligationBefore);
  }

  private applyRewardPatch(existing: Reward, dto: UpdateRewardDto): void {
    const d = dto as Record<string, unknown>;
    if (d.name !== undefined) existing.name = d.name as string;
    if (d.points !== undefined) existing.points = d.points as number;
    if (d.earned !== undefined) existing.earned = d.earned as boolean;
    if (d.fulfilled !== undefined) existing.fulfilled = d.fulfilled as boolean;
    if (d.progress !== undefined) existing.progress = d.progress as number;
    if (d.createdAt !== undefined && d.createdAt !== null) {
      existing.createdAt = new Date(d.createdAt as string);
    }
    if ('dayClaimed' in d) {
      existing.dayClaimed =
        d.dayClaimed == null || d.dayClaimed === '' ? undefined : new Date(d.dayClaimed as string);
    }
  }

  private async applyBalanceDelta(
    em: EntityManager,
    userId: string,
    balanceDelta: number,
    reasonPrefix: string,
    rewardId: string,
  ): Promise<void> {
    if (balanceDelta === 0) return;

    const userRepo = em.getRepository(User);
    const ledgerRepo = em.getRepository(PointLedger);

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const balance = user.points ?? 0;
    const next = balance + balanceDelta;
    if (next < 0) {
      throw new BadRequestException('Insufficient points');
    }

    user.points = next;
    user.updatedAt = new Date();
    await userRepo.save(user);

    await ledgerRepo.save({
      id: randomUUID(),
      amount: balanceDelta,
      reason: `${reasonPrefix}:${rewardId}`,
      userId,
      familyId: user.familyId ?? undefined,
      createdAt: new Date(),
    });
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
    return this.repo.manager.transaction(async (em) => {
      const rewardRepo = em.getRepository(Reward);
      const entity = rewardRepo.create({
        ...dto,
        createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
        dayClaimed: dto.dayClaimed ? new Date(dto.dayClaimed) : undefined,
      } as any);

      const nowClaimed = this.isClaimed(entity);
      const newPoints = entity.points ?? 0;
      const balanceDelta = this.obligationBalanceDelta(false, 0, nowClaimed, newPoints);

      const saved = await rewardRepo.save(entity);

      if (balanceDelta !== 0) {
        if (!saved.userId) {
          throw new BadRequestException('Cannot adjust points: reward has no userId');
        }
        await this.applyBalanceDelta(em, saved.userId, balanceDelta, 'reward_obligation', saved.id);
      }

      return saved;
    });
  }

  async update(id: string, dto: UpdateRewardDto) {
    const existing = await this.findOne(id);
    const wasClaimed = this.isClaimed(existing);
    const oldPoints = existing.points ?? 0;

    this.applyRewardPatch(existing, dto);

    const balanceDelta = this.obligationBalanceDelta(wasClaimed, oldPoints, this.isClaimed(existing), existing.points ?? 0);

    return this.repo.manager.transaction(async (em) => {
      if (balanceDelta !== 0) {
        if (!existing.userId) {
          throw new BadRequestException('Cannot adjust points: reward has no userId');
        }
        await this.applyBalanceDelta(em, existing.userId, balanceDelta, 'reward_obligation', existing.id);
      }
      return em.getRepository(Reward).save(existing);
    });
  }

  async updateForUser(id: string, userId: string, dto: UpdateRewardDto) {
    const existing = await this.findOneForUser(id, userId);
    const wasClaimed = this.isClaimed(existing);
    const oldPoints = existing.points ?? 0;

    this.applyRewardPatch(existing, dto);

    const balanceDelta = this.obligationBalanceDelta(wasClaimed, oldPoints, this.isClaimed(existing), existing.points ?? 0);

    return this.repo.manager.transaction(async (em) => {
      if (balanceDelta !== 0) {
        if (!existing.userId) {
          throw new BadRequestException('Cannot adjust points: reward has no userId');
        }
        await this.applyBalanceDelta(em, existing.userId, balanceDelta, 'reward_obligation', existing.id);
      }
      return em.getRepository(Reward).save(existing);
    });
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }

  async removeForUser(id: string, userId: string) {
    return this.repo.manager.transaction(async (em) => {
      const rewardRepo = em.getRepository(Reward);
      const entity = await rewardRepo.findOne({ where: { id, userId } });
      if (!entity) throw new NotFoundException('Reward not found');

      const wasClaimed = this.isClaimed(entity);
      const oldPoints = entity.points ?? 0;
      const balanceDelta = this.obligationBalanceDelta(wasClaimed, oldPoints, false, 0);

      if (balanceDelta !== 0) {
        if (!entity.userId) {
          throw new BadRequestException('Cannot adjust points: reward has no userId');
        }
        await this.applyBalanceDelta(em, entity.userId, balanceDelta, 'reward_delete_refund', entity.id);
      }

      await rewardRepo.softDelete(entity.id);
      return { id: entity.id };
    });
  }
}
