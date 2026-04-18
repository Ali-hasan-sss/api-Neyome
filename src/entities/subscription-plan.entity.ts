import { Entity, PrimaryColumn, Column, DeleteDateColumn } from 'typeorm';

@Entity({ name: 'subscription_plans' })
export class SubscriptionPlan {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'jsonb', nullable: true })
  badge?: any;

  @Column({ type: 'jsonb', nullable: true })
  features?: any;

  @Column({ type: 'text', nullable: true })
  productId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  subtitle?: any;

  @Column({ type: 'integer', nullable: true })
  sort?: number;

  @Column({ type: 'jsonb', nullable: true })
  title?: any;

  @Column({ type: 'jsonb', nullable: true })
  periodShort?: any;

  @Column({ type: 'integer', nullable: true })
  limitsVersion?: number;

  @Column({ type: 'jsonb', nullable: true })
  limits?: any;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
