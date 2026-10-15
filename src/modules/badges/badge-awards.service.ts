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
  completedTaskKeys: string[][];
  streak: number;
}

export interface BadgeEvaluation {
  awarded: string[];
  badges: BadgeMap;
}

/**
 * Grants family badges to children. A badge is earned once `threshold` is reached for its `trigger`:
 * - empty / `points`: current points balance
 * - `any_task`: completed tasks assigned to the child
 * - `streak`: best daily streak
 * - anything else: completed tasks whose task type key matches the trigger (or the badge id)
 * Earned badges are stored on `users.badges` as `{ [badgeId]: true }` and never revoked.
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
    if (!user || user.isParent === true || !user.familyId) return { awarded: [], badges: current };

    const badges = await this.badgeRepo.find({ where: [{ familyId: user.familyId }, { familyId: IsNull() }] });
    const candidates = badges.filter((b) => current[b.id] !== true && (b.threshold ?? 0) > 0);
    if (candidates.length === 0) return { awarded: [], badges: current };

    const metrics = await this.loadMetrics(user);
    const awarded = candidates.filter((b) => this.isEarned(b, metrics)).map((b) => b.id);
    if (awarded.length === 0) return { awarded, badges: current };

    for (const id of awarded) current[id] = true;
    await this.userRepo.update(user.id, { badges: current as any, updatedAt: new Date() });
    this.logger.log(`Awarded badges [${awarded.join(', ')}] to user ${user.id}`);
    return { awarded, badges: current };
  }

  private isEarned(badge: Badge, m: UserMetrics): boolean {
    const threshold = badge.threshold ?? 0;
    const trigger = normalizeKey(badge.trigger);

    if (!trigger || POINTS_TRIGGERS.has(trigger)) return m.points >= threshold;
    if (ANY_TASK_TRIGGERS.has(trigger)) return m.completedTaskKeys.length >= threshold;
    if (STREAK_TRIGGERS.has(trigger)) return m.streak >= threshold;

    const keys = new Set([trigger, trigger.replace(/^category_/, ''), normalizeKey(badge.id)]);
    const matching = m.completedTaskKeys.filter((taskKeys) => taskKeys.some((k) => keys.has(k))).length;
    return matching >= threshold;
  }

  private async loadMetrics(user: User): Promise<UserMetrics> {
    const [tasks, streak] = await Promise.all([
      this.taskRepo
        .createQueryBuilder('t')
        .select(['t.taskType', 't.taskTypeKey'])
        .where('t.assigneeId = :userId', { userId: user.id })
        .andWhere(`(t.completed = true OR LOWER(TRIM(t.status)) IN ('completed', 'done'))`)
        .getMany(),
      this.streakRepo.findOne({ where: { id: user.id } }),
    ]);

    return {
      points: user.points ?? 0,
      completedTaskKeys: tasks.map((t) => [normalizeKey(t.taskTypeKey), normalizeKey(t.taskType)].filter(Boolean)),
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

  /** Catches up children who already met a badge condition before auto-awarding existed. */
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
      for (const { familyId } of families) {
        const result = await this.evaluateFamily(familyId);
        awardedCount += Object.values(result).reduce((n, ids) => n + ids.length, 0);
      }
      this.logger.log(`Badge backfill done: ${families.length} families checked, ${awardedCount} badges awarded`);
    } catch (err) {
      this.logger.warn(`Badge backfill skipped: ${(err as Error).message}`);
    }
  }
}
