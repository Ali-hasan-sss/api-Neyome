import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Family } from '../entities/family.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class AdminBillingService {
  private readonly logger = new Logger(AdminBillingService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secretKey ? new Stripe(secretKey, { apiVersion: '2024-06-20' }) : null;
  }

  async listFamilySubscriptions(query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const [items, total] = await this.familyRepo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' as any },
      relations: { users: true },
      withDeleted: false,
    });

    const mapped = items.map((family) => {
      const owner = family.users?.find((u) => u.id === family.ownerId) ?? family.users?.[0];
      const plan = (family.plan ?? {}) as Record<string, unknown>;
      return {
        familyId: family.id,
        familyName: family.name,
        familyCode: family.familyCode,
        backendPlanId: plan.backendId ?? 'free',
        planUpdatedAt: plan.updatedAt,
        assignedByAdmin: plan.assignedByAdmin ?? false,
        owner: owner
          ? { id: owner.id, name: owner.name, email: owner.email, isParent: owner.isParent }
          : null,
        memberCount: family.users?.length ?? 0,
      };
    });

    return { items: mapped, total, page, limit };
  }

  async listStripePayments(limit = 30) {
    if (!this.stripe) {
      return { configured: false, items: [] as unknown[], message: 'STRIPE_SECRET_KEY not configured' };
    }

    try {
      const [invoices, sessions] = await Promise.all([
        this.stripe.invoices.list({ limit }),
        this.stripe.checkout.sessions.list({ limit: Math.min(limit, 20) }),
      ]);

      const invoiceItems = invoices.data.map((inv) => ({
        type: 'invoice' as const,
        id: inv.id,
        status: inv.status,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        customerEmail: inv.customer_email,
        createdAt: new Date((inv.created ?? 0) * 1000).toISOString(),
        familyId: (inv.subscription_details as any)?.metadata?.familyId ?? null,
      }));

      const sessionItems = sessions.data
        .filter((s) => s.mode === 'subscription')
        .map((s) => ({
          type: 'checkout_session' as const,
          id: s.id,
          status: s.status,
          amountTotal: s.amount_total,
          currency: s.currency,
          customerEmail: s.customer_details?.email ?? s.customer_email,
          createdAt: new Date((s.created ?? 0) * 1000).toISOString(),
          familyId: (s.metadata as any)?.familyId ?? s.client_reference_id ?? null,
          backendPlanId: (s.metadata as any)?.backendPlanId ?? null,
        }));

      return {
        configured: true,
        items: [...sessionItems, ...invoiceItems].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      };
    } catch (err) {
      this.logger.warn(`Stripe list failed: ${err}`);
      return { configured: true, items: [], message: 'Failed to fetch Stripe data' };
    }
  }
}
