import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { randomUUID } from 'crypto';
import { ClaimedReward } from '../../entities/claimed-reward.entity';
import { User } from '../../entities/user.entity';
import { PointLedger } from '../../entities/point-ledger.entity';
import { Reward } from '../../entities/reward.entity';
import { RewardList } from '../../entities/reward-list.entity';
import { JwtPayload } from '../../auth/auth.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ClaimedRewardQueryDto } from './dto/claimed-reward-query.dto';
import { CreateClaimedRewardDto } from './dto/create-claimed-reward.dto';
import { UpdateClaimedRewardDto } from './dto/update-claimed-reward.dto';

@Injectable()
export class ClaimedRewardsService implements OnModuleInit {
  private readonly logger = new Logger(ClaimedRewardsService.name);

  constructor(
    @InjectRepository(ClaimedReward)
    private readonly repo: Repository<ClaimedReward>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    @InjectRepository(RewardList)
    private readonly rewardListRepo: Repository<RewardList>,
  ) {}

  /** Older rows were saved without familyId/status; fill them so family-level queries see them. */
  async onModuleInit() {
    try {
      await this.repo.query(
        `UPDATE claimed_rewards cr SET "familyId" = u."familyId"
         FROM users u
         WHERE cr."userId" = u.id AND cr."familyId" IS NULL AND u."familyId" IS NOT NULL`,
      );
      await this.repo.query(
        `UPDATE claimed_rewards SET status = CASE WHEN approved = true THEN 'approved' ELSE 'pending' END
         WHERE status IS NULL OR status = ''`,
      );
    } catch (err) {
      this.logger.warn(`Claimed rewards backfill skipped: ${(err as Error).message}`);
    }
  }

  /** Claim / redemption is active for obligation accounting. A rejection refunds the child. */
  private isCommitted(cr: Pick<ClaimedReward, 'claimedAt' | 'earned' | 'approved' | 'status'>): boolean {
    if (cr.status === 'rejected') return false;
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
    if (d.approved !== undefined) {
      existing.approved = d.approved as boolean;
      if (d.status === undefined) {
        existing.status = existing.approved ? 'approved' : 'rejected';
      }
    }
    if (d.status !== undefined) {
      const status = d.status as 'pending' | 'approved' | 'rejected';
      existing.status = status;
      if (status === 'approved') existing.approved = true;
      if (status === 'rejected' || status === 'pending') existing.approved = false;
    }
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
    return { items: items.map((item) => this.present(item)), total, page, limit };
  }

  async findAllForUser(userId: string, query: PaginationQueryDto) {
    return this.findAllForCaller({ sub: userId, isParent: false }, query);
  }

  /**
   * Parents see every claim in their family (so they can approve pending ones).
   * Children see only their own claims.
   * `status=pending` is a claim the parent has not approved yet.
   */
  async findAllForCaller(caller: JwtPayload, query: ClaimedRewardQueryDto) {
    const { page = 1, limit = 20, sortBy, sortOrder, status, familyId } = query;
    const context = await this.callerContext(caller);

    if (familyId && context.familyId && familyId !== context.familyId) {
      throw new ForbiddenException('Family mismatch');
    }

    const qb = this.repo
      .createQueryBuilder('cr')
      .leftJoin('cr.user', 'owner')
      .where('cr.deletedAt IS NULL');

    if (context.isParent && context.familyId) {
      qb.andWhere('(cr.familyId = :familyId OR (cr.familyId IS NULL AND owner.familyId = :familyId))', {
        familyId: context.familyId,
      });
    } else {
      qb.andWhere('cr.userId = :userId', { userId: context.sub });
    }

    this.applyStatusFilter(qb, status);

    const sortColumn = sortBy && /^[a-zA-Z]+$/.test(sortBy) ? sortBy : 'claimedAt';
    qb.orderBy(`cr.${sortColumn}`, sortOrder === 'ASC' ? 'ASC' : 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((item) => this.present(item)), total, page, limit };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('ClaimedReward not found');
    return this.present(entity);
  }

  async findOneForUser(id: string, userId: string) {
    return this.findOneForCaller(id, { sub: userId, isParent: false });
  }

  async findOneForCaller(id: string, caller: JwtPayload) {
    const entity = await this.findVisible(id, caller);
    return this.present(entity);
  }

  /**
   * Children always create `pending` requests; only parents may create an already-approved row.
   * familyId comes from the requester's user row, never from the client.
   */
  async createForCaller(caller: JwtPayload, dto: CreateClaimedRewardDto) {
    const context = await this.callerContext(caller);
    const input: CreateClaimedRewardDto = { ...dto, userId: context.sub };
    if (!context.isParent) {
      input.status = 'pending';
      input.approved = false;
    }
    await this.fillFromReward(input, context.familyId);
    return this.create(input, context.familyId);
  }

  /** Fills missing name/cost from the claimed reward (family catalog or the child's own reward). */
  private async fillFromReward(dto: CreateClaimedRewardDto, familyId?: string) {
    if (!dto.rewardId || (dto.rewardName != null && dto.pointsUsed != null)) return;

    const source =
      (familyId ? await this.rewardListRepo.findOne({ where: { id: dto.rewardId, familyId } }) : null) ??
      (await this.rewardRepo.findOne({ where: { id: dto.rewardId, userId: dto.userId } }));
    if (!source) return;

    if (dto.rewardName == null && source.name != null) dto.rewardName = source.name;
    if (dto.pointsUsed == null && source.points != null) dto.pointsUsed = source.points;
  }

  async create(dto: CreateClaimedRewardDto, familyId?: string) {
    if (familyId === undefined && dto.userId) {
      const owner = await this.userRepo.findOne({ where: { id: dto.userId } });
      familyId = owner?.familyId ?? undefined;
    }

    return this.repo.manager.transaction(async (em) => {
      const rewardRepo = em.getRepository(ClaimedReward);
      const status = dto.status ?? (dto.approved === true ? 'approved' : 'pending');
      const entity = rewardRepo.create({
        ...dto,
        familyId: familyId ?? null,
        status,
        approved: dto.approved ?? status === 'approved',
        claimedAt: dto.claimedAt ? new Date(dto.claimedAt) : undefined,
      } as ClaimedReward);

      const saved = (await rewardRepo.save(entity)) as ClaimedReward;
      const committed = this.isCommitted(saved);
      const pts = saved.pointsUsed ?? 0;
      const balanceDelta = this.obligationBalanceDelta(false, 0, committed, pts);

      if (balanceDelta !== 0) {
        if (!saved.userId) {
          throw new BadRequestException('Cannot adjust points: claimed reward has no userId');
        }
        await this.applyBalanceDelta(em, saved.userId, balanceDelta, 'claimed_reward_obligation', saved.id);
      }

      return this.present(saved);
    });
  }

  async update(id: string, dto: UpdateClaimedRewardDto) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('ClaimedReward not found');
    return this.applyUpdate(existing, dto);
  }

  async updateForUser(id: string, userId: string, dto: UpdateClaimedRewardDto) {
    return this.updateForCaller(id, { sub: userId, isParent: false }, dto);
  }

  async updateForCaller(id: string, caller: JwtPayload, dto: UpdateClaimedRewardDto) {
    const context = await this.callerContext(caller);
    const existing = await this.findVisible(id, caller, context);
    if (!context.isParent) this.assertChildDecision(existing, dto);
    return this.applyUpdate(existing, dto);
  }

  /** A child may only cancel (reject) their own pending request; approving is the parent's call. */
  private assertChildDecision(existing: ClaimedReward, dto: UpdateClaimedRewardDto) {
    const touchesDecision = dto.approved !== undefined || dto.status !== undefined;
    if (!touchesDecision) return;

    const current = existing.status || (existing.approved === true ? 'approved' : 'pending');
    const next = dto.status ?? (dto.approved === true ? 'approved' : dto.approved === false ? 'rejected' : current);
    if (next === current) return;
    if (current === 'pending' && next === 'rejected') return;

    throw new ForbiddenException('Only a parent can approve or reject reward requests');
  }

  private async applyUpdate(existing: ClaimedReward, dto: UpdateClaimedRewardDto) {
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
      const saved = await em.getRepository(ClaimedReward).save(existing);
      return this.present(saved);
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

  private async callerContext(caller: JwtPayload): Promise<{ sub: string; isParent: boolean; familyId?: string }> {
    const user = await this.userRepo.findOne({ where: { id: caller.sub } });
    if (!user) throw new NotFoundException('User not found');
    return { sub: user.id, isParent: user.isParent === true, familyId: user.familyId };
  }

  private applyStatusFilter(qb: SelectQueryBuilder<ClaimedReward>, status?: string) {
    if (!status) return;
    if (status === 'pending') {
      qb.andWhere(
        `(cr.status = :pending OR ((cr.status IS NULL OR cr.status = '') AND (cr.approved IS NULL OR cr.approved = false)))`,
        { pending: 'pending' },
      );
      qb.andWhere(`(cr.status IS NULL OR cr.status <> :rejected)`, { rejected: 'rejected' });
      return;
    }
    if (status === 'approved') {
      qb.andWhere(`(cr.status = :approved OR cr.approved = true)`, { approved: 'approved' });
      return;
    }
    qb.andWhere(`cr.status = :rejected`, { rejected: 'rejected' });
  }

  /** Older rows have no status column value. Treat them as pending unless already approved. */
  private present(cr: ClaimedReward): ClaimedReward {
    if (!cr.status) {
      cr.status = cr.approved === true ? 'approved' : 'pending';
    }
    return cr;
  }

  private async findVisible(
    id: string,
    caller: JwtPayload,
    context?: { sub: string; isParent: boolean; familyId?: string },
  ): Promise<ClaimedReward> {
    context ??= await this.callerContext(caller);
    const entity = await this.repo.findOne({ where: { id }, relations: { user: true } });
    if (!entity) throw new NotFoundException('ClaimedReward not found');
    if (entity.userId === context.sub) return entity;
    const entityFamilyId = entity.familyId ?? entity.user?.familyId;
    if (context.isParent && context.familyId && entityFamilyId === context.familyId) return entity;
    throw new NotFoundException('ClaimedReward not found');
  }
}
