import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Family } from '../entities/family.entity';
import { SubscriptionPlansService } from '../modules/subscription-plans/subscription-plans.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    private readonly subscriptionPlansService: SubscriptionPlansService,
  ) {}

  async createUser(dto: AdminCreateUserDto): Promise<Partial<User>> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const isParent = dto.isParent !== false;
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const userId = crypto.randomUUID();

    if (isParent) {
      const family = await this.createFamilyWithUniqueCode({
        id: crypto.randomUUID(),
        name: `${dto.name}'s Family`,
        creatorId: userId,
        ownerId: userId,
        createdAt: new Date(),
        plan: { backendId: 'free', source: 'admin' },
      });

      const user = await this.userRepo.save(
        this.userRepo.create({
          id: userId,
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          isParent: true,
          isAdmin: false,
          familyId: family.id,
          familyCode: family.familyCode,
          locale: dto.locale || 'en',
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
      const { password, ...safe } = user;
      return safe;
    }

    if (!dto.familyId) {
      throw new BadRequestException('familyId is required for child users');
    }

    const family = await this.familyRepo.findOne({ where: { id: dto.familyId } });
    if (!family) throw new NotFoundException('Family not found');

    const user = await this.userRepo.save(
      this.userRepo.create({
        id: userId,
        email: dto.email,
        name: dto.name,
        isParent: false,
        isAdmin: false,
        familyId: family.id,
        familyCode: family.familyCode,
        locale: dto.locale || 'en',
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    return user;
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) throw new NotFoundException('User not found');
    if (!user.isParent) {
      throw new BadRequestException('Only parent accounts have passwords');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date();
    await this.userRepo.save(user);
  }

  async assignFamilyPlan(userId: string, backendPlanId: string): Promise<Family> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { family: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.familyId) {
      throw new BadRequestException('User has no family');
    }

    const plan = await this.subscriptionPlansService.findByBackendId(backendPlanId);
    if (!plan) throw new BadRequestException(`Unknown plan: ${backendPlanId}`);

    const family = await this.familyRepo.findOne({ where: { id: user.familyId } });
    if (!family) throw new NotFoundException('Family not found');

    const isFree = backendPlanId === 'free';
    family.plan = {
      ...(family.plan || {}),
      backendId: backendPlanId,
      status: isFree ? 'free' : 'active',
      assignedByAdmin: true,
      autoRenew: false,
      cancelAtPeriodEnd: false,
      // Admin assign is not Stripe-billed; keep existing Stripe ids only when staying on same paid plan
      ...(isFree
        ? {
            stripeSubscriptionId: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
          }
        : {}),
      updatedAt: new Date().toISOString(),
    };
    return await this.familyRepo.save(family);
  }

  private async createFamilyWithUniqueCode(
    base: Pick<Family, 'id' | 'name' | 'creatorId' | 'ownerId' | 'createdAt' | 'plan'>,
  ): Promise<Family> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const familyCode = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        return await this.familyRepo.save(this.familyRepo.create({ ...base, familyCode }));
      } catch (err: any) {
        if (err?.code === '23505') continue;
        throw err;
      }
    }
    throw new ConflictException('Failed to generate a unique family code');
  }
}
