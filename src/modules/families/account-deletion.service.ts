import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Family } from '../../entities/family.entity';
import { User } from '../../entities/user.entity';
import { Task } from '../../entities/task.entity';
import { Reward } from '../../entities/reward.entity';
import { RewardList } from '../../entities/reward-list.entity';
import { ClaimedReward } from '../../entities/claimed-reward.entity';
import { PointLedger } from '../../entities/point-ledger.entity';
import { Badge } from '../../entities/badge.entity';
import { TaskType } from '../../entities/task-type.entity';
import { Streak } from '../../entities/streak.entity';
import { UserSetting } from '../../entities/user-setting.entity';
import { StripeBillingService } from '../billing/stripe/stripe-billing.service';
import { UploadsService } from '../uploads/uploads.service';

export type AccountDeletionScope = 'family' | 'account';

@Injectable()
export class AccountDeletionService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly stripeBilling: StripeBillingService,
    private readonly uploads: UploadsService,
  ) {}

  /**
   * Owner only. Removes the family and every row that belongs to it:
   * members, tasks, rewards, reward lists, claims, points, badges, task types, streaks, settings.
   */
  async deleteFamily(familyId: string, userId: string): Promise<{ id: string; scope: AccountDeletionScope }> {
    if (!familyId) throw new NotFoundException('Family not found');
    const family = await this.familyRepo.findOne({ where: { id: familyId } });
    if (!family) throw new NotFoundException('Family not found');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.familyId !== family.id || !this.isOwner(user, family)) {
      throw new ForbiddenException('Only the account owner can delete the family');
    }

    await this.purgeFamily(family);
    return { id: family.id, scope: 'family' };
  }

  /**
   * Deletes the signed-in account.
   * The family owner also deletes the family and every member.
   * A child or co-parent deletes only their own account and personal rows.
   */
  async deleteMyAccount(userId: string): Promise<{ id: string; scope: AccountDeletionScope }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.familyId) {
      const family = await this.familyRepo.findOne({ where: { id: user.familyId } });
      if (family && this.isOwner(user, family)) {
        await this.purgeFamily(family);
        return { id: user.id, scope: 'family' };
      }
    }

    await this.purgeUsers([user]);
    return { id: user.id, scope: 'account' };
  }

  private isOwner(user: User, family: Family): boolean {
    if (family.ownerId) return family.ownerId === user.id;
    if (family.creatorId) return family.creatorId === user.id;
    return user.isParent === true;
  }

  private async purgeFamily(family: Family): Promise<void> {
    const plan = (family.plan ?? {}) as { stripeSubscriptionId?: string | null };
    await this.stripeBilling.cancelSubscriptionBestEffort(plan.stripeSubscriptionId);

    const members = await this.userRepo.find({
      where: { familyId: family.id },
      select: { id: true, profileImageUrl: true },
    });

    await this.dataSource.transaction(async (em) => {
      const ids = members.map((member) => member.id);
      await em.getRepository(Task).softDelete({ familyId: family.id });
      await em.getRepository(RewardList).softDelete({ familyId: family.id });
      await em.getRepository(PointLedger).softDelete({ familyId: family.id });
      await em.getRepository(Badge).softDelete({ familyId: family.id });
      await em.getRepository(TaskType).softDelete({ familyId: family.id });
      await em.getRepository(ClaimedReward).softDelete({ familyId: family.id });
      if (ids.length) {
        await em.getRepository(Task).softDelete({ assigneeId: In(ids) });
        await em.getRepository(Reward).softDelete({ userId: In(ids) });
        await em.getRepository(ClaimedReward).softDelete({ userId: In(ids) });
        await em.getRepository(PointLedger).softDelete({ userId: In(ids) });
        await em.getRepository(Streak).softDelete({ id: In(ids) });
        await em.getRepository(UserSetting).softDelete({ id: In(ids) });
        await this.anonymizeUsers(em, ids);
        await em.getRepository(User).softDelete({ id: In(ids) });
      }
      await em.getRepository(Family).update(family.id, { familyCode: null, name: null } as never);
      await em.getRepository(Family).softDelete(family.id);
    });

    await Promise.all(members.map((member) => this.uploads.deleteLocalAvatar(member.profileImageUrl)));
  }

  private async purgeUsers(users: User[]): Promise<void> {
    const ids = users.map((user) => user.id);
    if (!ids.length) return;

    await this.dataSource.transaction(async (em) => {
      await em.getRepository(Task).softDelete({ assigneeId: In(ids) });
      await em.getRepository(Reward).softDelete({ userId: In(ids) });
      await em.getRepository(ClaimedReward).softDelete({ userId: In(ids) });
      await em.getRepository(PointLedger).softDelete({ userId: In(ids) });
      await em.getRepository(Streak).softDelete({ id: In(ids) });
      await em.getRepository(UserSetting).softDelete({ id: In(ids) });
      await this.anonymizeUsers(em, ids);
      await em.getRepository(User).softDelete({ id: In(ids) });
    });

    await Promise.all(users.map((user) => this.uploads.deleteLocalAvatar(user.profileImageUrl)));
  }

  private async anonymizeUsers(em: EntityManager, ids: string[]): Promise<void> {
    await em.getRepository(User).update({ id: In(ids) }, {
      email: null,
      password: null,
      name: null,
      profileImageUrl: null,
      fcmTokens: null,
      pinHash: null,
      devicePinEnc: null,
      magicLinkToken: null,
      pendingEmail: null,
      emailChangeOtp: null,
      appleSub: null,
      familyCode: null,
      badges: null,
    } as never);
  }
}
