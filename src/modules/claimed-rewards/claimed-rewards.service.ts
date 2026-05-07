import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ClaimedReward } from '../../entities/claimed-reward.entity';
import { User } from '../../entities/user.entity';
import { PointLedger } from '../../entities/point-ledger.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateClaimedRewardDto } from './dto/create-claimed-reward.dto';
import { UpdateClaimedRewardDto } from './dto/update-claimed-reward.dto';

@Injectable()
export class ClaimedRewardsService {
  constructor(
    @InjectRepository(ClaimedReward)
    private readonly repo: Repository<ClaimedReward>,
  ) {}

  /** Claim / redemption is active for obligation accounting. */
  private isCommitted(cr: Pick<ClaimedReward, 'claimedAt' | 'earned' | 'approved'>): boolean {
    if (cr.approved === true) return true;
    if (cr.earned === true) return true;
    return cr.claimedAt != null;
  }

  private obligationBalanceDelta(wasCommitted: boolean, oldPoints: number, nowCommitted: boolean, newPoints: number): number {
    const obligationBefore = wasCommitted ? oldPoints : 0;
    const obligationAfter = nowCommitted ? newPoints : 0;
    return -(obligationAfter - obligationBefore);
  }

  private applyClaimedPatch(existing: ClaimedReward, dto: UpdateClaimedRewardDto): void {
    const d = dto as Record<string, unknown>;
    if (d.rewardName !== undefined) existing.rewardName = d.rewardName as string;
    if (d.rewardId !== undefined) existing.rewardId = d.rewardId as string;
    if (d.approved !== undefined) existing.approved = d.approved as boolean;
    if (d.earned !== undefined) existing.earned = d.earned as boolean;
    if (d.pointsUsed !== undefined) existing.pointsUsed = d.pointsUsed as number;
    if ('claimedAt' in d) {
      existing.claimedAt =
        d.claimedAt == null || d.claimedAt === '' ? undefined : new Date(d.claimedAt as string);
    }
  }

  private async applyBalanceDelta(
    em: EntityManager,
    userId: string,
    balanceDelta: number,
    reasonPrefix: string,
    claimedRewardId: string,
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
      reason: `${reasonPrefix}:${claimedRewardId}`,
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
    if (!entity) throw new NotFoundException('ClaimedReward not found');
    return entity;
  }

  async findOneForUser(id: string, userId: string) {
    const entity = await this.repo.findOne({ where: { id, userId } });
    if (!entity) throw new NotFoundException('ClaimedReward not found');
    return entity;
  }

  async create(dto: CreateClaimedRewardDto) {
    return this.repo.manager.transaction(async (em) => {
      const rewardRepo = em.getRepository(ClaimedReward);
      const entity = rewardRepo.create({
        ...dto,
        claimedAt: dto.claimedAt ? new Date(dto.claimedAt) : undefined,
      } as any);

      const saved = await rewardRepo.save(entity);
      const committed = this.isCommitted(saved);
      const pts = saved.pointsUsed ?? 0;
      const balanceDelta = this.obligationBalanceDelta(false, 0, committed, pts);

      if (balanceDelta !== 0) {
        if (!saved.userId) {
          throw new BadRequestException('Cannot adjust points: claimed reward has no userId');
        }
        await this.applyBalanceDelta(em, saved.userId, balanceDelta, 'claimed_reward_obligation', saved.id);
      }

      return saved;
    });
  }

  async update(id: string, dto: UpdateClaimedRewardDto) {
    const existing = await this.findOne(id);
    const wasCommitted = this.isCommitted(existing);
    const oldPts = existing.pointsUsed ?? 0;

    this.applyClaimedPatch(existing, dto);

    const balanceDelta = this.obligationBalanceDelta(
      wasCommitted,
      oldPts,
      this.isCommitted(existing),
      existing.pointsUsed ?? 0,
    );

    return this.repo.manager.transaction(async (em) => {
      if (balanceDelta !== 0) {
        if (!existing.userId) {
          throw new BadRequestException('Cannot adjust points: claimed reward has no userId');
        }
        await this.applyBalanceDelta(em, existing.userId, balanceDelta, 'claimed_reward_obligation', existing.id);
      }
      return em.getRepository(ClaimedReward).save(existing);
    });
  }

  async updateForUser(id: string, userId: string, dto: UpdateClaimedRewardDto) {
    const existing = await this.findOneForUser(id, userId);
    const wasCommitted = this.isCommitted(existing);
    const oldPts = existing.pointsUsed ?? 0;

    this.applyClaimedPatch(existing, dto);

    const balanceDelta = this.obligationBalanceDelta(
      wasCommitted,
      oldPts,
      this.isCommitted(existing),
      existing.pointsUsed ?? 0,
    );

    return this.repo.manager.transaction(async (em) => {
      if (balanceDelta !== 0) {
        if (!existing.userId) {
          throw new BadRequestException('Cannot adjust points: claimed reward has no userId');
        }
        await this.applyBalanceDelta(em, existing.userId, balanceDelta, 'claimed_reward_obligation', existing.id);
      }
      return em.getRepository(ClaimedReward).save(existing);
    });
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }

  async removeForUser(id: string, userId: string) {
    return this.repo.manager.transaction(async (em) => {
      const rewardRepo = em.getRepository(ClaimedReward);
      const entity = await rewardRepo.findOne({ where: { id, userId } });
      if (!entity) throw new NotFoundException('ClaimedReward not found');

      const wasCommitted = this.isCommitted(entity);
      const oldPts = entity.pointsUsed ?? 0;
      const balanceDelta = this.obligationBalanceDelta(wasCommitted, oldPts, false, 0);

      if (balanceDelta !== 0) {
        if (!entity.userId) {
          throw new BadRequestException('Cannot adjust points: claimed reward has no userId');
        }
        await this.applyBalanceDelta(em, entity.userId, balanceDelta, 'claimed_reward_delete_refund', entity.id);
      }

      await rewardRepo.softDelete(entity.id);
      return { id: entity.id };
    });
  }
}
