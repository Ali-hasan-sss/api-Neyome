import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Badge } from '../../entities/badge.entity';
import { User } from '../../entities/user.entity';
import { Task } from '../../entities/task.entity';
import { Streak } from '../../entities/streak.entity';

const POINTS_TRIGGERS = new Set(['points', 'point', 'total_points', 'points_total', 'points_earned']);
const ANY_TASK_TRIGGERS = new Set(['any_task', 'any_tasks', 'task', 'tasks', 'tasks_completed', 'task_count']);
const STREAK_TRIGGERS = new Set(['streak', 'streak_days', 'daily_streak']);

/** Legacy task types are stored as `all__<key>`; badge triggers may use `category_<key>`. */
function normalizeKey(value?: string | null): string {
  return (value ?? '').trim().toLowerCase().replace(/^all__/, '');
}

type BadgeMap = Record<string, boolean>;

interface UserMetrics {
  points: number;
  approvedByTaskTypeId: Record<string, number>;
  approvedTaskKeys: string[][];
  streak: number;
}

export interface BadgeEvaluation {
  awarded: string[];
  revoked: string[];
  badges: BadgeMap;
}

/**
 * Grants family badges to children.
 * Primary rule: when `taskTypeId` is set, award once the child has `threshold` **approved**
 * tasks of that type (`tasks.status = approved` and `tasks.taskType = taskTypeId`).
 * Legacy `trigger` strings still work for older rows that never stored `taskTypeId`.
 * Empty trigger + no taskTypeId does **not** award on points.
 */
@Injectable()
export class BadgeAwardsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BadgeAwardsService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Streak)
    private readonly streakRepo: Repository<Streak>,
  ) {}

  onApplicationBootstrap() {
    void this.backfill();
  }

  /** Never throws: badge bookkeeping must not fail the request that triggered it. */
  async evaluateUserSafely(userId?: string | null): Promise<BadgeEvaluation | null> {
    if (!userId) return null;
    try {
      return await this.evaluateUser(userId);
    } catch (err) {
      this.logger.error(`Badge evaluation failed for user ${userId}: ${(err as Error).message}`, (err as Error).stack);
      return null;
    }
  }

  async evaluateFamilySafely(familyId?: string | null): Promise<Record<string, string[]>> {
    if (!familyId) return {};
    try {
      return await this.evaluateFamily(familyId);
    } catch (err) {
      this.logger.error(`Badge evaluation failed for family ${familyId}: ${(err as Error).message}`, (err as Error).stack);
      return {};
    }
  }

  async evaluateFamily(familyId: string): Promise<Record<string, string[]>> {
    const children = await this.userRepo.find({
      where: [
        { familyId, isParent: false },
        { familyId, isParent: IsNull() },
      ],
      select: { id: true },
    });
    const result: Record<string, string[]> = {};
    for (const child of children) {
      result[child.id] = (await this.evaluateUser(child.id)).awarded;
    }
    return result;
  }

  async evaluateUser(userId: string): Promise<BadgeEvaluation> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const current = this.toBadgeMap(user?.badges);
    if (!user || user.isParent === true || !user.familyId) {
      return { awarded: [], revoked: [], badges: current };
    }

    const badges = await this.badgeRepo.find({ where: [{ familyId: user.familyId }, { familyId: IsNull() }] });
    if (badges.length === 0) return { awarded: [], revoked: [], badges: current };

    const metrics = await this.loadMetrics(user);
    const next: BadgeMap = { ...current };
    const awarded: string[] = [];
    const revoked: string[] = [];

    for (const badge of badges) {
      if ((badge.threshold ?? 0) <= 0) continue;
      const earned = this.isEarned(badge, metrics);
      const had = next[badge.id] === true;
      if (earned && !had) {
        next[badge.id] = true;
        awarded.push(badge.id);
      } else if (!earned && had) {
        delete next[badge.id];
        revoked.push(badge.id);
      }
    }

    if (awarded.length === 0 && revoked.length === 0) {
      return { awarded, revoked, badges: current };
    }

    await this.userRepo.update(user.id, { badges: next as any, updatedAt: new Date() });
    if (awarded.length) this.logger.log(`Awarded badges [${awarded.join(', ')}] to user ${user.id}`);
    if (revoked.length) this.logger.log(`Revoked badges [${revoked.join(', ')}] from user ${user.id}`);
    return { awarded, revoked, badges: next };
  }

  private isEarned(badge: Badge, m: UserMetrics): boolean {
    const threshold = badge.threshold ?? 0;
    if (threshold <= 0) return false;

    // Client creates badges with taskTypeId — count parent-approved tasks of that type.
    if (badge.taskTypeId) {
      return (m.approvedByTaskTypeId[badge.taskTypeId] ?? 0) >= threshold;
    }

    const trigger = normalizeKey(badge.trigger);
    // No type and no trigger: do not award on points (that caused every child to unlock every badge).
    if (!trigger) return false;
    if (POINTS_TRIGGERS.has(trigger)) return m.points >= threshold;
    if (ANY_TASK_TRIGGERS.has(trigger)) return m.approvedTaskKeys.length >= threshold;
    if (STREAK_TRIGGERS.has(trigger)) return m.streak >= threshold;

    const keys = new Set([trigger, trigger.replace(/^category_/, ''), normalizeKey(badge.id)]);
    const matching = m.approvedTaskKeys.filter((taskKeys) => taskKeys.some((k) => keys.has(k))).length;
    return matching >= threshold;
  }

  private async loadMetrics(user: User): Promise<UserMetrics> {
    const [tasks, streak] = await Promise.all([
      this.taskRepo
        .createQueryBuilder('t')
        .select(['t.taskType', 't.taskTypeKey'])
        .where('t.assigneeId = :userId', { userId: user.id })
        .andWhere(`LOWER(TRIM(COALESCE(t.status, ''))) = 'approved'`)
        .getMany(),
      this.streakRepo.findOne({ where: { id: user.id } }),
    ]);

    const approvedByTaskTypeId: Record<string, number> = {};
    for (const t of tasks) {
      if (!t.taskType) continue;
      approvedByTaskTypeId[t.taskType] = (approvedByTaskTypeId[t.taskType] ?? 0) + 1;
    }

    return {
      points: user.points ?? 0,
      approvedByTaskTypeId,
      approvedTaskKeys: tasks.map((t) => [normalizeKey(t.taskTypeKey), normalizeKey(t.taskType)].filter(Boolean)),
      streak: Math.max(streak?.count ?? 0, streak?.maxCount ?? 0),
    };
  }

  /** Accepts legacy shapes: null, `[]`/array of ids, or `{ id: boolean }`. */
  private toBadgeMap(raw: unknown): BadgeMap {
    if (Array.isArray(raw)) {
      return Object.fromEntries(raw.filter((id) => typeof id === 'string').map((id) => [id, true]));
    }
    if (raw && typeof raw === 'object') return { ...(raw as BadgeMap) };
    return {};
  }

  /** Recomputes awards (and revokes point-based false positives) after deploy. */
  private async backfill() {
    try {
      const hasGlobal = (await this.badgeRepo.count({ where: { familyId: IsNull() } })) > 0;
      const families = hasGlobal
        ? await this.userRepo
            .createQueryBuilder('u')
            .select('DISTINCT u.familyId', 'familyId')
            .where('u.familyId IS NOT NULL')
            .getRawMany<{ familyId: string }>()
        : await this.badgeRepo
            .createQueryBuilder('b')
            .select('DISTINCT b.familyId', 'familyId')
            .where('b.familyId IS NOT NULL')
            .getRawMany<{ familyId: string }>();

      let awardedCount = 0;
      let revokedCount = 0;
      for (const { familyId } of families) {
        const children = await this.userRepo.find({
          where: [
            { familyId, isParent: false },
            { familyId, isParent: IsNull() },
          ],
          select: { id: true },
        });
        for (const child of children) {
          const result = await this.evaluateUser(child.id);
          awardedCount += result.awarded.length;
          revokedCount += result.revoked.length;
        }
      }
      this.logger.log(
        `Badge backfill done: ${families.length} families checked, ${awardedCount} awarded, ${revokedCount} revoked`,
      );
    } catch (err) {
      this.logger.warn(`Badge backfill skipped: ${(err as Error).message}`);
    }
  }
}
